
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries
} from "lightweight-charts";
import { RefreshCw, Eye, EyeOff } from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const periods = ["1D", "1W", "1M", "3M", "1Y"];

function calculateSMA(data, period) {
  return data
    .map((item, index) => {
      if (index < period - 1) return null;

      const slice = data.slice(index - period + 1, index + 1);
      const average =
        slice.reduce((sum, candle) => sum + candle.close, 0) / period;

      return {
        time: item.time,
        value: average
      };
    })
    .filter(Boolean);
}

function calculateRSI(data, period = 14) {
  if (data.length <= period) return [];

  const result = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    gains += Math.max(change, 0);
    losses += Math.max(-change, 0);
  }

  let averageGain = gains / period;
  let averageLoss = losses / period;

  const getRSI = () => {
    if (averageGain === 0 && averageLoss === 0) return 50;
    if (averageLoss === 0) return 100;
    return 100 - 100 / (1 + averageGain / averageLoss);
  };

  result.push({
    time: data[period].time,
    value: getRSI()
  });

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;

    averageGain =
      (averageGain * (period - 1) + Math.max(change, 0)) / period;

    averageLoss =
      (averageLoss * (period - 1) + Math.max(-change, 0)) / period;

    result.push({
      time: data[i].time,
      value: getRSI()
    });
  }

  return result;
}

function calculateEMA(data, period) {
  if (data.length < period) return [];

  const multiplier = 2 / (period + 1);
  const result = [];

  let ema =
    data.slice(0, period).reduce((sum, item) => sum + item.close, 0) /
    period;

  result.push({
    time: data[period - 1].time,
    value: ema
  });

  for (let i = period; i < data.length; i++) {
    ema = data[i].close * multiplier + ema * (1 - multiplier);

    result.push({
      time: data[i].time,
      value: ema
    });
  }

  return result;
}

function calculateMACD(data) {
  const fastEMA = calculateEMA(data, 12);
  const slowEMA = calculateEMA(data, 26);

  const slowMap = new Map(
    slowEMA.map((item) => [item.time, item.value])
  );

  const macdLine = fastEMA
    .filter((item) => slowMap.has(item.time))
    .map((item) => ({
      time: item.time,
      value: item.value - slowMap.get(item.time)
    }));

  if (macdLine.length < 9) {
    return {
      macd: [],
      signal: [],
      histogram: []
    };
  }

  const multiplier = 2 / 10;
  const signal = [];

  let signalEMA =
    macdLine.slice(0, 9).reduce((sum, item) => sum + item.value, 0) / 9;

  signal.push({
    time: macdLine[8].time,
    value: signalEMA
  });

  for (let i = 9; i < macdLine.length; i++) {
    signalEMA =
      macdLine[i].value * multiplier +
      signalEMA * (1 - multiplier);

    signal.push({
      time: macdLine[i].time,
      value: signalEMA
    });
  }

  const signalMap = new Map(
    signal.map((item) => [item.time, item.value])
  );

  const histogram = macdLine
    .filter((item) => signalMap.has(item.time))
    .map((item) => ({
      time: item.time,
      value: item.value - signalMap.get(item.time),
      color:
        item.value >= signalMap.get(item.time)
          ? "rgba(34, 197, 94, 0.7)"
          : "rgba(239, 68, 68, 0.7)"
    }));

  return {
    macd: macdLine,
    signal,
    histogram
  };
}

function CandlestickChart({ symbol = "RELIANCE" }) {
  const chartContainerRef = useRef(null);
  const rsiContainerRef = useRef(null);
  const macdContainerRef = useRef(null);

  const chartRef = useRef(null);
  const rsiChartRef = useRef(null);
  const macdChartRef = useRef(null);

  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const sma20Ref = useRef(null);
  const sma50Ref = useRef(null);
  const rsiSeriesRef = useRef(null);

  const macdLineRef = useRef(null);
  const signalLineRef = useRef(null);
  const macdHistogramRef = useRef(null);

  const [period, setPeriod] = useState("1M");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dataSourceExchange, setDataSourceExchange] = useState("");
  const [isFallback, setIsFallback] = useState(false);

  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(true);

  useEffect(() => {
    if (
      !chartContainerRef.current ||
      !rsiContainerRef.current ||
      !macdContainerRef.current
    ) {
      return;
    }

    const chartOptions = {
      layout: {
        background: { color: "#111827" },
        textColor: "#94a3b8"
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" }
      },
      rightPriceScale: {
        borderColor: "#334155"
      },
      timeScale: {
        borderColor: "#334155",
        timeVisible: true
      }
    };

    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height: 420
    });

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444"
    });

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: ""
    });

    const sma20 = chart.addSeries(LineSeries, {
      color: "#f59e0b",
      lineWidth: 2,
      title: "SMA 20",
      priceLineVisible: false,
      lastValueVisible: false
    });

    const sma50 = chart.addSeries(LineSeries, {
      color: "#38bdf8",
      lineWidth: 2,
      title: "SMA 50",
      priceLineVisible: false,
      lastValueVisible: false
    });

    chart.priceScale("").applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0
      }
    });

    const rsiChart = createChart(rsiContainerRef.current, {
      ...chartOptions,
      width: rsiContainerRef.current.clientWidth,
      height: 180,
      rightPriceScale: {
        borderColor: "#334155",
        scaleMargins: {
          top: 0.1,
          bottom: 0.1
        }
      }
    });

    const rsi = rsiChart.addSeries(LineSeries, {
      color: "#a78bfa",
      lineWidth: 2,
      title: "RSI 14",
      priceLineVisible: false,
      lastValueVisible: true,
      autoscaleInfoProvider: () => ({
        priceRange: {
          minValue: 0,
          maxValue: 100
        }
      })
    });

    rsi.createPriceLine({
      price: 70,
      color: "#ef4444",
      lineWidth: 1,
      lineStyle: 2,
      title: "70"
    });

    rsi.createPriceLine({
      price: 30,
      color: "#22c55e",
      lineWidth: 1,
      lineStyle: 2,
      title: "30"
    });

    const macdChart = createChart(macdContainerRef.current, {
      ...chartOptions,
      width: macdContainerRef.current.clientWidth,
      height: 180,
      rightPriceScale: {
        borderColor: "#334155"
      }
    });

    const macdHistogram = macdChart.addSeries(HistogramSeries, {
      priceLineVisible: false,
      lastValueVisible: false,
      base: 0
    });

    const macdLine = macdChart.addSeries(LineSeries, {
      color: "#38bdf8",
      lineWidth: 2,
      title: "MACD",
      priceLineVisible: false,
      lastValueVisible: true
    });

    const signalLine = macdChart.addSeries(LineSeries, {
      color: "#f59e0b",
      lineWidth: 2,
      title: "Signal",
      priceLineVisible: false,
      lastValueVisible: true
    });

    macdLine.createPriceLine({
      price: 0,
      color: "#64748b",
      lineWidth: 1,
      lineStyle: 2,
      title: "Zero"
    });

    chartRef.current = chart;
    rsiChartRef.current = rsiChart;
    macdChartRef.current = macdChart;

    candleSeriesRef.current = candles;
    volumeSeriesRef.current = volume;
    sma20Ref.current = sma20;
    sma50Ref.current = sma50;
    rsiSeriesRef.current = rsi;

    macdLineRef.current = macdLine;
    signalLineRef.current = signalLine;
    macdHistogramRef.current = macdHistogram;

    const resizeObserver = new ResizeObserver(() => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }

      if (rsiContainerRef.current) {
        rsiChart.applyOptions({
          width: rsiContainerRef.current.clientWidth
        });
      }

      if (macdContainerRef.current) {
        macdChart.applyOptions({
          width: macdContainerRef.current.clientWidth
        });
      }
    });

    resizeObserver.observe(chartContainerRef.current);
    resizeObserver.observe(rsiContainerRef.current);
    resizeObserver.observe(macdContainerRef.current);

    return () => {
      resizeObserver.disconnect();

      chart.remove();
      rsiChart.remove();
      macdChart.remove();

      chartRef.current = null;
      rsiChartRef.current = null;
      macdChartRef.current = null;

      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      sma20Ref.current = null;
      sma50Ref.current = null;
      rsiSeriesRef.current = null;

      macdLineRef.current = null;
      signalLineRef.current = null;
      macdHistogramRef.current = null;
    };
  }, []);

  useEffect(() => {
    sma20Ref.current?.applyOptions({ visible: showSMA20 });
    sma50Ref.current?.applyOptions({ visible: showSMA50 });
    volumeSeriesRef.current?.applyOptions({ visible: showVolume });

    if (rsiContainerRef.current) {
      rsiContainerRef.current.style.display = showRSI ? "block" : "none";

      if (showRSI) {
        requestAnimationFrame(() => {
          if (rsiContainerRef.current && rsiChartRef.current) {
            rsiChartRef.current.applyOptions({
              width: rsiContainerRef.current.clientWidth
            });
          }
        });
      }
    }

    if (macdContainerRef.current) {
      macdContainerRef.current.style.display = showMACD ? "block" : "none";

      if (showMACD) {
        requestAnimationFrame(() => {
          if (macdContainerRef.current && macdChartRef.current) {
            macdChartRef.current.applyOptions({
              width: macdContainerRef.current.clientWidth
            });
          }
        });
      }
    }
  }, [showSMA20, showSMA50, showVolume, showRSI, showMACD]);

  useEffect(() => {
    let active = true;

    const fetchChartData = async () => {
      setLoading(true);
      setError("");
      setDataSourceExchange("");
      setIsFallback(false);

      try {
        const response = await axios.get(
          `${API_URL}/api/stocks/prices`,
          {
            params: { symbol, period },
            timeout: 30000
          }
        );

        const responseData = response.data?.data;
        const data = responseData?.data;

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No chart data available");
        }

        const candles = data
          .filter(
            (item) =>
              Number.isFinite(Number(item.open)) &&
              Number.isFinite(Number(item.high)) &&
              Number.isFinite(Number(item.low)) &&
              Number.isFinite(Number(item.close)) &&
              Number.isFinite(new Date(item.date).getTime())
          )
          .map((item) => ({
            time: Math.floor(new Date(item.date).getTime() / 1000),
            open: Number(item.open),
            high: Number(item.high),
            low: Number(item.low),
            close: Number(item.close)
          }))
          .sort((a, b) => a.time - b.time);

        const uniqueCandles = candles.filter(
          (item, index, array) =>
            index === 0 || item.time !== array[index - 1].time
        );

        const volumes = data
          .filter(
            (item) =>
              item.volume !== null &&
              item.volume !== undefined &&
              Number.isFinite(new Date(item.date).getTime())
          )
          .map((item) => ({
            time: Math.floor(new Date(item.date).getTime() / 1000),
            value: Number(item.volume) || 0,
            color:
              Number(item.close) >= Number(item.open)
                ? "rgba(34, 197, 94, 0.45)"
                : "rgba(239, 68, 68, 0.45)"
          }))
          .sort((a, b) => a.time - b.time);

        if (uniqueCandles.length === 0) {
          throw new Error("No valid candlestick data available");
        }

        if (!active) return;

        setDataSourceExchange(
          responseData?.dataSourceExchange || responseData?.exchange || ""
        );

        setIsFallback(responseData?.isFallback === true);

        candleSeriesRef.current?.setData(uniqueCandles);
        volumeSeriesRef.current?.setData(volumes);
        sma20Ref.current?.setData(calculateSMA(uniqueCandles, 20));
        sma50Ref.current?.setData(calculateSMA(uniqueCandles, 50));
        rsiSeriesRef.current?.setData(calculateRSI(uniqueCandles, 14));

        const macdData = calculateMACD(uniqueCandles);

        macdLineRef.current?.setData(macdData.macd);
        signalLineRef.current?.setData(macdData.signal);
        macdHistogramRef.current?.setData(macdData.histogram);

        chartRef.current?.timeScale().fitContent();
        rsiChartRef.current?.timeScale().fitContent();
        macdChartRef.current?.timeScale().fitContent();
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load chart data"
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchChartData();

    return () => {
      active = false;
    };
  }, [symbol, period]);

  const toggleButton = (label, enabled, setter, color) => (
    <button
      type="button"
      onClick={() => setter((previous) => !previous)}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
        enabled
          ? "border-slate-600 bg-slate-800 text-white"
          : "border-slate-800 bg-transparent text-slate-500"
      }`}
    >
      {enabled ? <Eye size={14} /> : <EyeOff size={14} />}
      <span className={color}>{label}</span>
    </button>
  );

  return (
    <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5 text-white">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{symbol}</h2>

          <p className="mt-1 text-sm text-slate-400">
            Advanced technical analysis
          </p>

          {dataSourceExchange && (
            <div className="mt-2">
              <span className="inline-flex rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
                {isFallback
                  ? "NSE historical data · BSE stock selected"
                  : `${dataSourceExchange} historical data`}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {periods.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setPeriod(item)}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                period === item
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {toggleButton("SMA 20", showSMA20, setShowSMA20, "text-amber-400")}
        {toggleButton("SMA 50", showSMA50, setShowSMA50, "text-sky-400")}
        {toggleButton("Volume", showVolume, setShowVolume, "text-green-400")}
        {toggleButton("RSI 14", showRSI, setShowRSI, "text-purple-400")}
        {toggleButton("MACD", showMACD, setShowMACD, "text-cyan-400")}
      </div>

      {loading && (
        <div className="mb-3 flex items-center gap-2 text-sm text-blue-400">
          <RefreshCw size={15} className="animate-spin" />
          Loading chart...
        </div>
      )}

      {error && (
        <p className="mb-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div
        ref={chartContainerRef}
        className="min-h-[420px] w-full"
      />

      {showRSI && (
        <div className="mt-6 border-t border-slate-800 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">RSI (14)</h3>

            <span className="text-xs text-purple-400">
              Momentum Indicator
            </span>
          </div>

          <div
            ref={rsiContainerRef}
            className="min-h-[180px] w-full"
          />

          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>Oversold: 30</span>
            <span>Overbought: 70</span>
          </div>
        </div>
      )}

      {showMACD && (
        <div className="mt-6 border-t border-slate-800 pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">MACD (12, 26, 9)</h3>

            <div className="flex flex-wrap gap-3 text-xs">
              <span className="text-sky-400">MACD Line</span>
              <span className="text-amber-400">Signal Line</span>
              <span className="text-slate-400">Histogram</span>
            </div>
          </div>

          <div
            ref={macdContainerRef}
            className="min-h-[180px] w-full"
          />

          <p className="mt-2 text-xs text-slate-500">
            MACD shows the relationship between short-term and long-term
            exponential moving averages.
          </p>
        </div>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Historical data from Yahoo Finance. Data may be delayed.
        Technical indicators are informational and not investment advice.
      </p>
    </section>
  );
}

export default CandlestickChart;
