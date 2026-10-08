const expected=JSON.parse(process.env.BRAINKNOT_DEPLOYMENT_INPUT);
async function variable(name){const response=await fetch('https://api.github.com/repos/eaverdeg/eaverdeg.github.io/actions/variables/'+name,{headers:{authorization:'Bearer '+process.env.BRAINKNOT_RELEASE_TOKEN,accept:'application/vnd.github+json'}});if(!response.ok)throw new Error('Ownership check failed.');return JSON.parse((await response.json()).value);}
const owner=await variable('BRAINKNOT_OWNER'),latest=await variable('BRAINKNOT_DEPLOYMENT');
if(JSON.stringify(owner)!==JSON.stringify(expected.owner)||latest.version!==expected.version)throw new Error('Stale host/job rejected before Pages deployment.');
