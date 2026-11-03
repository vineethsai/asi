import{downloadBlob as s,exportFilename as c}from"./download-7bsLAk6z.js";const a=e=>(e??"").replace(/\|/g,"\\|").replace(/\r?\n/g," ").trim()||" ",$=e=>e.toLowerCase().replace(/[^a-z0-9 -]/g,"").trim().replace(/\s+/g,"-");function l(e){let t=e.title?`**${e.title}**

`:"";if(e.rows.length===0)return`${t}_None._

`;t+=`| ${e.columns.map(a).join(" | ")} |
|${e.columns.map(()=>" --- ").join("|")}|
`;for(const n of e.rows)t+=`| ${n.map(a).join(" | ")} |
`;return e.note&&(t+=`
_${e.note}_
`),`${t}
`}function i(e,t){var o;let n=`${"#".repeat(t)} ${e.title}

`;for(const r of e.paragraphs??[])n+=`${r}

`;for(const r of e.tables??[])n+=l(r);(o=e.bullets)!=null&&o.length&&(n+=`${e.bullets.map(r=>`- ${r}`).join(`
`)}

`);for(const r of e.children??[])n+=i(r,t+1);return n}function p(e){const t=e.headline;let n=`# ${e.title}: ${e.modelName}

`;n+=`_${e.indicativeNote} Generated ${e.generatedAt.slice(0,19).replace("T"," ")} UTC by engine ${e.engineVersion}._

`,n+=`| Model score | Inherent | Threats | Open | Mitigated | Components | Flows | Boundaries | Attack paths |
|---|---|---|---|---|---|---|---|---|
`,n+=`| **${t.score}/100 (${t.label})** | ${t.inherent}/100 | ${t.threats} | ${t.open} | ${t.mitigated} | ${t.components} | ${t.flows} | ${t.boundaries} | ${t.paths}${t.pathsTruncated?"+":""} |

`,n+=`## Contents

${e.sections.map(o=>`- [${o.title}](#${$(o.title)})`).join(`
`)}

`;for(const o of e.sections)n+=i(o,2);n+=`## Approval

| Role | Name | Date | Signature |
|---|---|---|---|
`;for(const o of e.approval)n+=`| ${o.role} | ${o.name||" "} | ${o.date||" "} | |
`;return n}function d(e,t){s(p(e),t??c(e.modelName,"md"),"text/markdown;charset=utf-8")}export{d as downloadMarkdownReport,p as renderMarkdown};
