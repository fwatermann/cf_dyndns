import express from "express";
import * as CloudFlare from "./cloudflare";

const app = express();

app.get("/update/:zoneId/:domain", async (req, res, next) => {

	if(req.params.zoneId && req.params.domain && (req.query.ipv4 || req.query.ipv6)) {
		
		if(!req.query.bearer || typeof(req.query.bearer) != "string") {
			console.log(`Invalid Auth: ${req.query.bearer} (${typeof(req.query.bearer)})`);
			res.status(401).contentType("text/plain").send("badauth");
			return;
		}
		
	
		try {
			let tokenVerify = await CloudFlare.checkAPIToken(req.query.bearer as string);
			
			if(!tokenVerify) {
				console.log(`Invalid Auth (CFReject): ${req.query.bearer} (${typeof(req.query.bearer)})`);
				res.status(401).contentType("text/plain").send("badauth");
				return;
			}

			const bearer = req.query.bearer as string;
			const zoneId = req.params.zoneId;
			const domain = req.params.domain;
			const ipv4 = req.query.ipv4;
			const ipv6 = req.query.ipv6;

			let records = await CloudFlare.getRecordId(bearer, zoneId, domain);

			if(records == null || records.length == 0) {
				res.status(404).contentType("text/plain").send("nohost");
				return;
			}

			let changes = 0;

			for(let i = 0; i < records.length; i ++) {
				if(records[i].type == "A" && ipv4 != undefined && ipv4 != null && records[i].content != ipv4) {
					let success = await CloudFlare.updateRecord(bearer, zoneId, records[i].id, ipv4 as string, "A");
					if(success) {
						changes ++;
					} else {
						res.status(500).contentType("text/plain").send("dnserr");
						return;
					}
				} 
				if(records[i].type == "AAAA" && ipv6 != undefined && ipv6 != null && records[i].content != ipv6) {
					let success = await CloudFlare.updateRecord(bearer, zoneId, records[i].id, ipv6 as string, "AAAA");
					if(success) {
						changes ++;
					} else {
						res.status(500).contentType("text/plain").send("dnserr");
						return;
					}
				}
			}

			if(changes > 0) {
				res.status(200).contentType("text/plain").send("good");
				return;
			} else {
				res.status(200).contentType("text/plain").send("nochg");
				return;
			}

		} catch(err) {
			console.log(err);
			res.status(401).contentType("text/plain").send("badauth");
			return;
		}

	} else {
		console.log("Missing Request Parameters");
		res.status(400).contentType("text/plain").send("badsys");
		return;
	}

	next();

});

app.listen(2021, () => {
	console.log("Started Server on 0.0.0.0:2021");
});