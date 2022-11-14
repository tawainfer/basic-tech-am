let all;
let unit = [];
let chapter = [];
let section = [];
let problem = [];
let unitIndex = 0;
let chapIndex = 0;
let sectIndex = 0;
let upBorder = 0;
let downBorder = 0;
let schedule = [
  ["午前免除(12月)", new Date(2022, 12 - 1, 11, 9, 15, 0)],
  ["午前免除(1月)", new Date(2023, 1 - 1, 22, 9, 15, 0)]
]
// let startTime = 0;
// let endTime = 0;

// 現在時刻の取得・カウントダウン
let countdown = setInterval(() => {
  let currentTime = new Date();
  
  for(let i = 0; i < schedule.length; i++) {
    let targetTime = schedule[i][1];
    let remainTime = targetTime - currentTime;
    if(remainTime < 0) remainTime = 0;

    //差分の日・時・分・秒を取得
    let diffDay  = Math.floor(remainTime / 1000 / 60 / 60 / 24);
    let diffHour = Math.floor(remainTime / 1000 / 60 / 60 ) % 24;
    let diffMin  = Math.floor(remainTime / 1000 / 60) % 60;
    let diffSec  = Math.floor(remainTime / 1000) % 60;

    //残りの日時を上書き
    document.getElementById(`day${i + 1}`).innerHTML  = diffDay;
    document.getElementById(`hour${i + 1}`).innerHTML = diffHour;
    document.getElementById(`min${i + 1}`).innerHTML  = diffMin;
    document.getElementById(`sec${i + 1}`).innerHTML  = diffSec;
  }
}, 1000)    //1秒間に1度処理

// ファイル読み込みの設定
let fileInput = document.getElementById("csv_file");
let message = document.getElementById("message");
let fileReader = new FileReader();

// ファイル読み込み時
fileInput.onchange = () => {
  let file = fileInput.files[0];
  fileReader.readAsText(file, "Shift_JIS");
}

// ファイル読み込み成功時
fileReader.onload = () => {
  // startTime = performance.now();

  message.innerHTML = "読み込みに成功しました！";
  document.getElementById("option").style.display = "none";
  document.getElementById("news").style.display = "none";
  document.getElementById("all").style.display = "block";

  upBorder = Number(document.getElementById("red").value);
  downBorder = Number(document.getElementById("blue").value);

  all = makeObject(all, false);
  let result = fileReader.result;
  splitToLine(result);

  // endTime = performance.now();
  // console.log(endTime - startTime);
  setTimeout(() => {
    generateSettingTable(-1, -1, -1);
    generateTable();
  }, 500);
}

// ファイル読み込み失敗時
fileReader.onerror = () => {
  message.innerHTML = "ファイル読み込みに失敗しました。ブラウザを更新してから再度お試しください。";
}

// 行単位に分割
let splitToLine = s => {
  let line = s.split("\r\n");
  let del = true;
  while (del) {
    if (line[line.length - 1][0] == 'E') del = false;
    line.pop();
  }
  splitToCeil(line);
}

// セル単位に分割
let splitToCeil = v => {
  v.forEach(s => {
    let ceil = s.split(',');

    if (ceil[0][0] === '[') processSection(ceil);
    else {
      let isUnit = true;
      for (let i = 0; i < ceil[0].length; i++) {
        if (ceil[0][i] === '.') {
          isUnit = false;
          break;
        }
      }

      if (isUnit) processUnit(ceil);
      else processChapter(ceil);
    }
  });
}

// オブジェクトを作成
let makeObject = (e, isProblem) => {
  e = {};

  if (isProblem) {
    e["correctCnt"] = 0;
    e["wrongCnt"] = 0;
    e["solveCnt"] = 0;
    e["lastAnswer"] = false;
    e["evenOnceAnswer"] = false;
    e["evenOnceWrong"] = false;
  } else {
    e["name"] = "";
    e["problemCnt"] = 0;

    e["correctCnt"] = [];
    e["wrongCnt"] = [];
    e["solveCnt"] = [];
    e["lastAnswer"] = 0;
    e["evenOnceAnswer"] = 0;
    e["evenOnceWrong"] = 0;
  }

  return e;
}

// 単元の処理
let processUnit = v => {
  unitIndex = Number(v[0]) - 1;
  chapter[unitIndex] = [];
  section[unitIndex] = [];
  problem[unitIndex] = [];

  let e = unit[unitIndex];
  e = makeObject(e, false);

  e["name"] = v[1];
  // console.log("UNIT", unitIndex + 1, v);
  unit[unitIndex] = e;
}

// 章の処理
let processChapter = v => {
  let s = "";
  let del = true;
  for (let i = 0; i < v[0].length; i++) {
    if (!del) s += v[0][i];
    if (v[0][i] === '.') del = false;
  };

  chapIndex = Number(s) - 1;
  section[unitIndex][chapIndex] = [];
  problem[unitIndex][chapIndex] = [];

  let e = chapter[unitIndex][chapIndex];
  e = makeObject(e, false);

  e["name"] = v[1];
  // console.log("CHAP", chapIndex + 1, v);
  chapter[unitIndex][chapIndex] = e;
}

// 節の処理
let processSection = v => {
  let s = "";
  for (let i = 0; i < v[0].length; i++) {
    if (!(i === 0 || i === (v[0].length - 1))) s += v[0][i];
  };

  sectIndex = Number(s) - 1;
  problem[unitIndex][chapIndex][sectIndex] = [];

  let e = section[unitIndex][chapIndex][sectIndex];
  e = makeObject(e, false);

  e["name"] = v[1];
  // console.log("SECT", sectIndex + 1, v);
  section[unitIndex][chapIndex][sectIndex] = e;

  let problemCnt = Number(v[2]);
  for (let i = 0; i < 3; i++) v.shift();

  processProblem(v, problemCnt);
}

// 問題の処理
let processProblem = (v, cnt) => {
  for (let probIndex = 0; probIndex < cnt; probIndex++) {
    let e = problem[unitIndex][chapIndex][sectIndex][probIndex];
    e = makeObject(e, true);

    let s = v[probIndex];
    for (let i = 0; i < s.length; i++) {
      e["solveCnt"]++;

      if (s[i] === 'o') {
        e["correctCnt"]++;
        e["lastAnswer"] = true;
        e["evenOnceAnswer"] = true;
      } else {
        e["wrongCnt"]++;
        e["lastAnswer"] = false;
        e["evenOnceWrong"] = true;
      }
    }

    let ep = [];
    ep[0] = all;
    ep[1] = unit[unitIndex];
    ep[2] = chapter[unitIndex][chapIndex];
    ep[3] = section[unitIndex][chapIndex][sectIndex];

    for (let i = 0; i < 4; i++) {
      ep[i]["problemCnt"]++;
      if (e["lastAnswer"]) ep[i]["lastAnswer"]++;
      if (e["evenOnceAnswer"]) ep[i]["evenOnceAnswer"]++;
      if (e["evenOnceWrong"]) ep[i]["evenOnceWrong"]++;

      ep[i]["correctCnt"].push(e["correctCnt"]);
      ep[i]["correctCnt"].sort();
      ep[i]["wrongCnt"].push(e["wrongCnt"]);
      ep[i]["wrongCnt"].sort();
      ep[i]["solveCnt"].push(e["solveCnt"]);
      ep[i]["solveCnt"].sort();
    }

    all = ep[0];
    unit[unitIndex] = ep[1];
    chapter[unitIndex][chapIndex] = ep[2];
    section[unitIndex][chapIndex][sectIndex] = ep[3];
    problem[unitIndex][chapIndex][sectIndex][probIndex] = e;
  }
}

// 表を生成
let generateTable = () => {
  for (let i = 0; i < problem.length; i++) {
    generateSettingTable(i, -1, -1);

    for (let j = 0; j < problem[i].length; j++) {
      generateSettingTable(i, j, -1);

      for (let k = 0; k < problem[i][j].length; k++) {
        generateSettingTable(i, j, k);

      }
    }
  }
}

// 表の設定を定義
let generateSettingTable = (i, j, k) => {
  i++;
  j++;
  k++;
  let id = `table${i}_${j}_${k}`;

  let p = document.createElement("div");
  p.setAttribute("id", id);
  p.style.display = "none";
  if (i === 0 && j === 0 && k === 0) p.style.display = "block";
  let e = document.createElement("table");
  e.setAttribute("border", 1);
  e.setAttribute("cellpadding", "10");

  if (i === 0 && j === 0 && k === 0) {
    generateUnitTable(p, e);
  } else if (j === 0 && k === 0) {
    generateChapterTable(p, e, i);
  } else if (k === 0) {
    generateSectionTable(p, e, i, j);
  } else {
    generateProblemTable(p, e, i, j, k);
  }
}

let generateUnitTable = (p, e) => {
  let sum = all["problemCnt"];
  let once = sum - binarySearch(all["solveCnt"], 1);
  let rate = (once / sum * 100).toFixed(2);
  document.getElementById("allOnce").innerHTML = `<span style="color:${changeColor(rate)};">${rate}%(${sum}問中${once}問正解)</span>`;

  let twice = sum - binarySearch(all["solveCnt"], 2);
  rate = (twice / sum * 100).toFixed(2);
  document.getElementById("allTwice").innerHTML = `<span style="color:${changeColor(rate)};">${rate}%(${sum}問中${twice}問正解)</span>`;

  let achievement = all["evenOnceAnswer"];
  rate = (achievement / sum * 100).toFixed(2);
  document.getElementById("allAchievement").innerHTML = `<span style="color:${changeColor(rate)};">${rate}%(${sum}問中${achievement}問正解)</span>`;

  let last = all["lastAnswer"];
  rate = (last / sum * 100).toFixed(2);
  document.getElementById("allUnderstanding").innerHTML = `<span style="color:${changeColor(rate)};">${rate}%(${sum}問中${last}問正解)</span>`;

  let s = "";

  s += "<tr><th></th>";
  for (let i = 1; i <= unit.length; i++) s += `<th>単元${i}</th>`;
  s += "</tr>";

  s += "<tr><td><b>単元名</b></td>";
  for (let i = 0; i < unit.length; i++) s += `<td><a href="javascript:changeDisplay(${i + 1}, 0, 0);">${unit[i]["name"]}</a></td>`;
  s += "</tr>";

  s += "<tr><td><b>1回</b></td>";
  for (let i = 0; i < unit.length; i++) {
    let sum = unit[i]["problemCnt"];
    let once = sum - binarySearch(unit[i]["solveCnt"], 1);
    let rate = (once / sum * 100).toFixed(2);
    s += `<td><span style="color:${changeColor(rate)};">${rate}%<br>(${once} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>2回</b></td>";
  for (let i = 0; i < unit.length; i++) {
    let sum = unit[i]["problemCnt"];
    let twice = sum - binarySearch(unit[i]["solveCnt"], 2);
    let rate = (twice / sum * 100).toFixed(2);
    s += `<td><span style="color:${changeColor(rate)};">${rate}%<br>(${twice} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>達成率</b></td>";
  for (let i = 0; i < unit.length; i++) {
    let sum = unit[i]["problemCnt"];
    let achievement = unit[i]["evenOnceAnswer"];
    let rate = (achievement / sum * 100).toFixed(2);
    s += `<td><span style="color:${changeColor(rate)};">${rate}%<br>(${achievement} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>理解度</b></td>";
  for (let i = 0; i < unit.length; i++) {
    let sum = unit[i]["problemCnt"];
    let last = unit[i]["lastAnswer"];
    let rate = (last / sum * 100).toFixed(2);
    s += `<td><span style="color:${changeColor(rate)};">${rate}%<br>(${last} / ${sum})</span></td>`;
  }
  s += "</tr>";

  e.innerHTML = s;
  p.appendChild(e);
  document.getElementById("data").appendChild(p);
}

let generateChapterTable = (p, e, u) => {
  u--;
  let title = document.createElement("p");
  title.innerHTML = `●単元${u + 1} ${unit[u]["name"]}`;
  p.appendChild(title);

  let s = "";

  s += "<tr><th></th>";
  for (let i = 1; i <= chapter[u].length; i++) s += `<th>${u + 1}.${i}</th>`;
  s += "</tr>";

  s += "<tr><td><b>チャプター名</b></td>";
  for (let i = 0; i < chapter[u].length; i++) s += `<td><a href="javascript:changeDisplay(${u + 1}, ${i + 1}, 0);">${chapter[u][i]["name"]}</a></td>`;
  s += "</tr>";

  s += "<tr><td><b>1回</b></td>";
  for (let i = 0; i < chapter[u].length; i++) {
    let sum = chapter[u][i]["problemCnt"];
    let once = sum - binarySearch(chapter[u][i]["solveCnt"], 1);
    let rate = (once / sum * 100).toFixed(2);
    s += `<td><span style="color:${changeColor(rate)};">${rate}%<br>(${once} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>2回</b></td>";
  for (let i = 0; i < chapter[u].length; i++) {
    let sum = chapter[u][i]["problemCnt"];
    let twice = sum - binarySearch(chapter[u][i]["solveCnt"], 2);
    let rate = (twice / sum * 100).toFixed(2);
    s += `<td><span style="color:${changeColor(rate)};">${rate}%<br>(${twice} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>達成率</b></td>";
  for (let i = 0; i < chapter[u].length; i++) {
    let sum = chapter[u][i]["problemCnt"];
    let achievement = chapter[u][i]["evenOnceAnswer"];
    let rate = (achievement / sum * 100).toFixed(2);
    s += `<td><span style="color:${changeColor(rate)};">${rate}%<br>(${achievement} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>理解度</b></td>";
  for (let i = 0; i < chapter[u].length; i++) {
    let sum = chapter[u][i]["problemCnt"];
    let last = chapter[u][i]["lastAnswer"];
    let rate = (last / sum * 100).toFixed(2);
    s += `<td><span style="color:${changeColor(rate)};">${rate}%<br>(${last} / ${sum})</span></td>`;
  }
  s += "</tr>";

  e.innerHTML = s;
  p.appendChild(e);
  document.getElementById("data").appendChild(p);
}

let generateSectionTable = (p, e, u, c) => {
  u--;
  c--;
  let title = document.createElement("p");
  title.innerHTML = `●${u + 1}.${c + 1} ${chapter[u][c]["name"]}`;
  p.appendChild(title);

  let s = "";

  s += "<tr><th></th>";
  for (let i = 1; i <= section[u][c].length; i++) s += `<th>(${i})</th>`;
  s += "</tr>";

  s += "<tr><td><b>セクション名</b></td>";
  for (let i = 0; i < section[u][c].length; i++) s += `<td><a href="javascript:changeDisplay(${u + 1}, ${c + 1}, ${i + 1});">${section[u][c][i]["name"]}</a></td>`;
  s += "</tr>";

  s += "<tr><td><b>1回</b></td>";
  for (let i = 0; i < section[u][c].length; i++) {
    let sum = section[u][c][i]["problemCnt"];
    let once = sum - binarySearch(section[u][c][i]["solveCnt"], 1);
    let rate = (once / sum * 100).toFixed(2);
    s += `<td><span style="color:${changeColor(rate)};">${rate}%<br>(${once} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>2回</b></td>";
  for (let i = 0; i < section[u][c].length; i++) {
    let sum = section[u][c][i]["problemCnt"];
    let twice = sum - binarySearch(section[u][c][i]["solveCnt"], 2);
    let rate = (twice / sum * 100).toFixed(2);
    s += `<td><span style="color:${changeColor(rate)};">${rate}%<br>(${twice} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>達成率</b></td>";
  for (let i = 0; i < section[u][c].length; i++) {
    let sum = section[u][c][i]["problemCnt"];
    let achievement = section[u][c][i]["evenOnceAnswer"];
    let rate = (achievement / sum * 100).toFixed(2);
    s += `<td><span style="color:${changeColor(rate)};">${rate}%<br>(${achievement} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>理解度</b></td>";
  for (let i = 0; i < section[u][c].length; i++) {
    let sum = section[u][c][i]["problemCnt"];
    let last = section[u][c][i]["lastAnswer"];
    let rate = (last / sum * 100).toFixed(2);
    s += `<td><span style="color:${changeColor(rate)};">${rate}%<br>(${last} / ${sum})</span></td>`;
  }
  s += "</tr>";

  e.innerHTML = s;
  p.appendChild(e);
  document.getElementById("data").appendChild(p);
}

let generateProblemTable = (p, e, u, c, si) => {
  u--;
  c--;
  si--;
  let title = document.createElement("p");
  title.innerHTML = `●${u + 1}.${c + 1} (${si + 1}) ${section[u][c][si]["name"]}`;
  p.appendChild(title);

  let s = "";

  for (let r = 0; r < Math.ceil(problem[u][c][si].length / 15); r++) {
    s += "<tr><th></th>";
    for (let i = (r * 15 + 1); i <= Math.min(problem[u][c][si].length, (r + 1) * 15); i++) s += `<th>問${i}</th>`;
    s += "</tr>";

    s += "<tr><td><b>解いた回数</b></td>";
    for (let i = (r * 15); i < Math.min(problem[u][c][si].length, (r + 1) * 15); i++) {
      s += `<td>${problem[u][c][si][i]["solveCnt"]}回</td>`;
    }
    s += "</tr>";

    s += "<tr><td><b>正解した回数</b></td>";
    for (let i = (r * 15); i < Math.min(problem[u][c][si].length, (r + 1) * 15); i++) {
      s += `<td>${problem[u][c][si][i]["correctCnt"]}回</td>`;
    }
    s += "</tr>";

    s += "<tr><td><b>間違えた回数</b></td>";
    for (let i = (r * 15); i < Math.min(problem[u][c][si].length, (r + 1) * 15); i++) {
      s += `<td>${problem[u][c][si][i]["wrongCnt"]}回</td>`;
    }
    s += "</tr>";

    s += "<tr><td><b>最後に正解</b></td>";
    for (let i = (r * 15); i < Math.min(problem[u][c][si].length, (r + 1) * 15); i++) {
      let ans;
      if (problem[u][c][si][i]["lastAnswer"]) ans = "o";
      else ans = "x";
      s += `<td>${ans}</td>`;
    }
    s += "</tr>";
  }

  e.innerHTML = s;
  p.appendChild(e);
  document.getElementById("data").appendChild(p);
}

// 二分探索
let binarySearch = (v, key) => {
  let left = -1;
  let right = v.length;

  while (right - left > 1) {
    let mid = Math.floor(left + (right - left) / 2);
    if (v[mid] >= key) right = mid;
    else left = mid;
  }

  return right;
}

// 表の表示・非表示を切り替える
let changeDisplay = (u, c, si) => {
  for (let i = 1; i <= unit.length; i++) {
    document.getElementById(`table${i}_0_0`).style.display = "none";
  }

  for (let i = 1; i <= unit.length; i++) {
    for (let j = 1; j <= chapter[i - 1].length; j++) {
      for (let k = 0; k <= section[i - 1][j - 1].length; k++) {
        document.getElementById(`table${i}_${j}_${k}`).style.display = "none";
      }
    }
  }

  if (u !== 0) document.getElementById(`table${u}_0_0`).style.display = "block";
  if (c !== 0) document.getElementById(`table${u}_${c}_0`).style.display = "block";
  if (si !== 0) document.getElementById(`table${u}_${c}_${si}`).style.display = "block";
}

let changeColor = n => {
  if (n >= upBorder) return "#e00";
  else if(n < downBorder) return "#00e";
  else return "#000";
}
