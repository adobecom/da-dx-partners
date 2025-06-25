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

  document.querySelector("main").append(root);


  const rows = Array.from(el.children);
  rows.forEach((row) => {
    const cols = Array.from(row.children);
    if(cols.length<2){
      return;
    }
    const rowTitle = cols[0].innerText.trim().toLowerCase().replace(/ /g, '-');

    if (rowTitle === "prod-script" && prodHosts.includes(window.location.host)) {
      for(const link of cols[1].querySelectorAll("a")){
        document.head.appendChild(createScript( link.getAttribute("href"), true));
      }
    }
    if (rowTitle === "stage-script" && !prodHosts.includes(window.location.host)) {
      for(const link of cols[1].querySelectorAll("a")){
        document.head.appendChild(createScript( link.getAttribute("href"), true));
      }
    }
    if (rowTitle === "prod-styles" && prodHosts.includes(window.location.host)) {
      for(const script of cols[1].querySelectorAll("a")){
        document.head.appendChild(createStyle( script.getAttribute("href")));
      }
    }
    if (rowTitle === "stage-styles" && !prodHosts.includes(window.location.host)) {
      for(const script of cols[1].querySelectorAll("a")){
        document.head.appendChild(createStyle( script.getAttribute("href")));
      }
    }
  });

  performance.mark('react-include:end');
  performance.measure('react-include block', 'react-include:start', 'react-include:end');
}
