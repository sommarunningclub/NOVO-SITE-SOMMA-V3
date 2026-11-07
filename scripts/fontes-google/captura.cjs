/** Captura os pedidos do next/font ao Google durante um build (ver README.md). */
const path=require('path'),fs=require('fs');
try{
 const p=require.resolve(path.join(process.cwd(),'node_modules/next/dist/compiled/@next/font/dist/google/fetch-css-from-google-fonts.js'));
 const m=require(p); const orig=m.fetchCSSFromGoogleFonts;
 m.fetchCSSFromGoogleFonts=async function(url,fam,dev){const css=await orig(url,fam,dev);fs.appendFileSync(process.env.CAPTURA_SAIDA,JSON.stringify({url,css})+'\n');return css};
}catch(e){}
