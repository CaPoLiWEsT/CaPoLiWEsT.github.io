if (typeof MoeVideo === "undefined") {
  document.head.appendChild(
    Object.assign(document.createElement("script"), {
      src: "https://player.moeni.org/lib.js",
    })
  );
}
async function getList(path) {
  const body = new FormData();
  body.append("path", path); // ['host', 'moeni.org']?
  const data = await fetch("//player.moeni.org", { method: "POST", body });
  const elem = document.createElement("div");
  elem.innerHTML = await data.text();

  const tags = [...elem.querySelector("#eb").getElementsByTagName("a")];

  return tags.map((it) => ({
    name: it.getAttribute("sel"),
    origin: it.getAttribute("onclick").split('"')[5],
  }));
}
async function findAndDownloadMoeni(path, n) {
  let list;
  try {
    list = await getList(path);
    if (typeof n != "number") {
      return list.map((it) => it.name);
    }
    const { origin } = list[n];

    const torrentId = `https://player.moeni.org/${origin}.m3u8`;
    //const webSeedURL = (it) => `https://${it}.momoafile.info/${origin}.moe`;
    const webSeedURL = (it) => `https://${it}.inefile.xyz/${origin}.moe`;
    const client = new MoeVideo({ webSeeds: false });

    client.add(
      torrentId,
      {
        announce: ["wss://s0.momoafile.info/tracker"],
        maxWebConns: 3,
      },
      (torrent) => {
        torrent.files.forEach((file) => {
          file.getBlobURL((err, url) => {
            if (err) throw err;
            console.log(`BLOB URL for ${file.name} : ${url}`);
            const a = document.createElement("a");
            a.download = file.name;
            a.href = url;
            a.textContent = "Download " + file.name;
            a.click();
          });
        });

        console.log("File list: ", torrent.files);
        console.log("Adding Seeds...");
        ["s0", "s0-1", "s1"].forEach((it) => torrent.addWebSeed(webSeedURL(it)));
        console.log("Adding Interval Checker...");
        const interval = setInterval(() => {
          const [d, l, p] = [
            torrent.downloaded / 1024,
            torrent.length / 1024,
            torrent.progress * 100,
          ].map(Math.floor);
          console.log(`${torrent.name} ${d}/${l} (${p}%)`);
        }, 500);
        console.log("Adding Finish Handler...");
        torrent.on("done", () => {
          console.log("Finished.");
          torrent.pause();
          clearInterval(interval);
        });
      }
    );
  } catch (e) {
    console.error(e);
    console.log(
      "서버가 응답하지 않거나 요청이 잘못되었습니다. 다음은 path에서 검색된 회차 목록입니다."
    );
    console.log(list.map((it) => it.name));
  }
}
