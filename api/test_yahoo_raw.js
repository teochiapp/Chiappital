async function test() {
  const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/EA.BA?interval=1d&range=2y');
  const data = await res.json();
  if (data.chart.result) {
    console.log("Quotes count:", data.chart.result[0].timestamp ? data.chart.result[0].timestamp.length : 0);
  } else {
    console.log(data);
  }
}
test();
