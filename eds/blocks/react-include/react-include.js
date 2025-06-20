import {prodHosts} from "../../scripts/utils.js";

function createScript(url, defer) {
  let script = document.createElement('script');
  script.src =url;
  script.defer = defer;
  return script;
}

function createStyle(url) {
  let link = document.createElement('link')
  link.href = url;
  link.rel = "stylesheet";
  return link;
}

export default async function init(el) {
  performance.mark('react-include:start');

  let root = document.createElement('div');
  root.id = 'root';

  let link;
  let mainScript;

  const rows = Array.from(el.children);
  rows.forEach((row) => {
    const cols = Array.from(row.children);
    const rowTitle = cols[0].innerText.trim().toLowerCase().replace(/ /g, '-');

    if (rowTitle === "prod-script" && prodHosts.includes(window.location.host)) {
      mainScript = createScript( cols[1]?.innerText.trim(), true);
    }
    if (rowTitle === "stage-script" && !prodHosts.includes(window.location.host)) {
      mainScript = createScript(cols[1]?.innerText.trim(), true);
    }
    if (rowTitle === "prod-styles" && prodHosts.includes(window.location.host)) {
      link = createStyle(cols[1]?.innerText.trim());
    }
    if (rowTitle === "stage-styles" && !prodHosts.includes(window.location.host)) {
      link = createStyle(cols[1]?.innerText.trim());
    }
  });
  if(!mainScript){
    return;
  }

  //these paths are fixed for now, as all react apps need them. We're checking with Gnan if they need to be made configurable / authorable.
  const flexhost =  prodHosts.includes(window.location.host)? 'https://partner-directory-ui-flex.adobe.io' : 'https://partner-directory-ui-flex-stage.adobe.io'
  let configScript = createScript( flexhost+'/configuration.js');
  let newRelicScript = createScript( flexhost+'/newrelic.js');
  let typeKitLink = createStyle('https://use.typekit.net/shu5jul.css');


  document.querySelector("main").append(root);
  document.head.appendChild(typeKitLink);
  document.head.appendChild(link);
  document.head.appendChild(configScript);
  document.head.appendChild(newRelicScript);
  document.head.appendChild(mainScript);

  performance.mark('react-include:end');
  performance.measure('react-include block', 'react-include:start', 'react-include:end');
}
