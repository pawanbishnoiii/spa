import fs from "node:fs";
import ts from "typescript";
const source=fs.readFileSync("lib/enquiry-privacy.ts","utf8").replace(/import \{env\} from "cloudflare:workers";/,'const env={ENQUIRY_ENCRYPTION_KEY:btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))};');
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const privacy=await import("data:text/javascript;base64,"+Buffer.from(code).toString("base64"));
const ciphertext=await privacy.encryptDetails({name:"Test Person",phone:"+919876543210",service:"aroma"});
const result=await privacy.decryptDetails({encrypted_details:ciphertext});
if(result.name!=="Test Person"||ciphertext.includes("Test Person"))throw Error("Encryption roundtrip failed");
let rejects=false;try{await privacy.decryptDetails({encrypted_details:ciphertext.slice(0,-4)+"AAAA"})}catch{rejects=true}
if(!rejects)throw Error("Tamper test failed");
console.log("AES-GCM roundtrip, plaintext concealment and tamper rejection: PASS");
