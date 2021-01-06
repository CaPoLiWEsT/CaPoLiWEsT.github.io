async function downloadNthWeek(week, modtype = ['vod'], indexToSelect = undefined) {
  const isItOrInArrayOrDefault = (needle, haystack) => {
    if(Array.isArray(haystack)) return haystack.includes(needle);
    if(typeof haystack === typeof needle) return haystack === needle;
    return true;
  }
  const selector = `#section-${week} > .content > ul`;
  const targets = [...document.querySelector(selector).getElementsByTagName('li')]
  .map(li => ({
    li,
    id: li.id.split('-')[1],
    type: li.classList[1],
    nameNode: li.querySelector('.instancename')?.childNodes[0]
  }))
  .filter(({type}) => isItOrInArrayOrDefault(type, modtype))
  .filter(({nameNode}) => (nameNode) && (nameNode.nodeType === Node.TEXT_NODE))
  .map(it => ({
    ...it,
    name: it.nameNode.data
  }))
  .filter((_, index) => isItOrInArrayOrDefault(index, indexToSelect));
  
  console.log(`Detected to download ${targets.length} files`);
  console.log(targets.map(({name}) => name));

  const tryDownloadMsg = 'File download available. Trying downloading';
  const vodSourcePrefix = "http://vod.kaist.ac.kr/rest/stream/"
  const urlPrefix = 'http://klms.kaist.ac.kr/mod';
  const urlInfix = {
    ubfile: 'ubfile/view.php',
    vod: 'vod/viewer.php'
  }
  const downloadFromURL = (url) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = true;
    a.click();
  }
  const handler = {
    async ubfile({redirected, url}) {
      if(redirected) {
        console.log(tryDownloadMsg)
        downloadFromURL(url);
      } else {
        console.log(`Failed: Non-redirected link for file type is not allowed..` + 
        ` The instructor may not open the file yet.`);
      }
    },

    async vod(res) {
      const responseText = await (await res.blob()).text();
      const urlIndexBegin = responseText.indexOf(vodSourcePrefix);
      const urlIndexEnd = responseText.indexOf("'", urlIndexBegin);
      const urlThumbnail = responseText.slice(urlIndexBegin, urlIndexEnd);
      const url = urlThumbnail.slice(0, urlThumbnail.indexOf('thumbnail')) + 'convert;settId=24';
        //.replace("thumbnail;idx=1;size=640*360", "convert;settId=24");
      console.log(tryDownloadMsg)
      downloadFromURL(url);
    }
  };

  for (const target of targets) {
    console.log(`Now: ${target.type} type target: ${target.name}`);
    try {
      const res = await fetch(`${urlPrefix}/${urlInfix[target.type]}?id=${target.id}`)
      if(res.ok) {
        await handler[target.type](res);
      } else {
        console.log(`Failed: Response is not ok for ${target.name}`);
      }
      
    } catch (e) {
      console.error(`Failed: Error catched for ${target.name}: ${e}`);
    }
  }
}
