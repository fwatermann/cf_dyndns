import axios from "axios";
import util from "util";

export async function updateRecord(bearer : string, zoneId : string, recordId : string, content : string, type : "A"|"AAAA") : Promise<boolean> {

    try {
        let response = await axios.patch(
            `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`, 
            JSON.stringify({
                type: type,
                content: content
            }),
            {
                headers: {
                    "Authorization": `Bearer ${bearer}`,
                    "Content-Type": "application/json"
                }
            }
        );
        if(response.status == 200 && response.data.success) {
            console.log(`Updated DNS-Record ${zoneId}/${recordId} (${response.data.result.name}) to ${type}/${content}`);
            return true;
        } else {
            console.log(`Could not update DNS-Record ${zoneId}/${recordId} to ${type}/${content} Error: ${response.data}`);
            return false;
        }
    } catch(err: any) {
        console.error(util.inspect(err, true, null, true));
        if("response" in err) {
            const response = err.response;
            if("data" in response) {
                console.error("\nResponse Data:")
                console.error(util.inspect(response.data, true, null, true));
            }
        }
        return false;
    }
}


export async function getRecordId(bearer: string, zoneId: string, recordName: string) : Promise<{ id: string, type: "A" | "AAAA", content: string}[] | null> {

    try {
        let response = await axios.get(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${encodeURIComponent(recordName)}`, {
            headers: {
                "Authorization": `Bearer ${bearer}`
            }
        });

        if(response.status == 200 && response.data.success) {

            let data = response.data;
            let ret = [];

            for(let i = 0; i < data.result_info.count; i ++) {
                if(data.result[i].type == "A" || data.result[i].type == "AAAA") {
                    ret.push({id: data.result[i].id, type: data.result[i].type, content: data.result[i].content});
                }
            }

            console.log(`Found DNS-Records in Zone ${zoneId}: ${JSON.stringify(ret)}`);
            return ret;
        } else {
            console.log(`Could not load DNS-Records for Zone ${zoneId} ?name=${recordName}: ${response.data}`);
            return null;
        }
    } catch(err) {
        console.log(`Could not load DNS-Records for Zone ${zoneId} ?name=${recordName}: ${err}`);
        return null;
    }

}

export async function checkAPIToken(bearer: string) : Promise<boolean> {

	return new Promise<boolean>((resolve, reject) => {
		
		axios.get("https://api.cloudflare.com/client/v4/user/tokens/verify", {
			headers: {
				"Authorization": "Bearer " + bearer
			}
		}).then((response) => {
			if(response.status == 200 && response.data.success) {
				resolve(true);
			} else {
				resolve(false);
			}
		}).catch((error) => {
			reject(error);
		});

	});

}