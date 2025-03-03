import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as echarts from 'echarts';


const StockChart = () => {
  const chartRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chart, setChart] = useState(null);
  const [timeframe, setTimeframe] = useState('1D');
  const [currentSymbol, setCurrentSymbol] = useState('MSFT');
  // Add timeframe options
  const timeframeOptions = [
    { label: 'Daily', value: '1D' },
    { label: 'Weekly', value: '1W' },
    { label: 'Monthly', value: '1M' },
    { label: '3 Months', value: '3M' },
    { label: 'Yearly', value: '12M' }
  ];

  function splitData(rawData) {
    console.log('Splitting raw data:', rawData);
    let categoryData = [];
    let values = [];
    let volumes = [];
    
    try {
      for (let i = 0; i < rawData.length; i++) {
        const item = [...rawData[i]]; // Create a copy of the array
        categoryData.push(item[0]);
        values.push([item[1], item[2], item[3], item[4]]); // Open, Close, Low, High
        volumes.push([i, item[5], item[1] > item[2] ? 1 : -1]); // Volume
      }
      
      console.log('Split data result:', {
        categoryData,
        values,
        volumes
      });
      
      return {
        categoryData: categoryData,
        values: values,
        volumes: volumes
      };
    } catch (error) {
      console.error('Error splitting data:', error);
      throw error;
    }
  }

  function calculateEMA(range, data) {
    const k = 2 / (range + 1); // Smoothing factor for EMA
    let ema = [];
    
    // First EMA value is the same as SMA
    let sum = 0;
    for (let i = 0; i < range && i < data.values.length; i++) {
      sum += data.values[i][1];
    }
    ema.push(sum / Math.min(range, data.values.length));

    // Calculate subsequent EMA values
    for (let i = 1; i < data.values.length; i++) {
      const currentPrice = data.values[i][1];
      const prevEMA = ema[i - 1];
      const currentEMA = (currentPrice - prevEMA) * k + prevEMA;
      ema.push(+currentEMA.toFixed(3));
    }
    
    return ema;
  }

  const updateChartOption = useCallback((chartInstance, data) => {
    try {
      console.log('Updating chart with data:', data);
      const option = {
        animation: true,
        legend: {
          bottom: 10,
          left: 'center',
          data: ['Stock index', 'EMA5', 'EMA21', 'EMA50']
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          textStyle: {
            color: '#000'
          }
        },
        grid: [
          {
            left: '10%',
            right: '8%',
            height: '50%'
          },
          {
            left: '10%',
            right: '8%',
            top: '63%',
            height: '16%'
          }
        ],
        xAxis: [
          {
            type: 'category',
            data: data.categoryData,
            boundaryGap: false,
            axisLine: { onZero: false },
            splitLine: { show: false },
            min: 'dataMin',
            max: 'dataMax'
          },
          {
            type: 'category',
            gridIndex: 1,
            data: data.categoryData,
            boundaryGap: false,
            axisLine: { onZero: false },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            min: 'dataMin',
            max: 'dataMax'
          }
        ],
        yAxis: [
          {
            scale: true,
            splitArea: {
              show: true
            }
          },
          {
            scale: true,
            gridIndex: 1,
            splitNumber: 2,
            axisLabel: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: false }
          }
        ],
        dataZoom: [
          {
            type: 'inside',
            xAxisIndex: [0, 1],
            start: 50,
            end: 100
          },
          {
            show: true,
            xAxisIndex: [0, 1],
            type: 'slider',
            top: '85%',
            start: 50,
            end: 100
          }
        ],
        series: [
          {
            name: 'Stock index',
            type: 'candlestick',
            data: data.values,
            itemStyle: {
              color: '#14b143',
              color0: '#ef232a',
              borderColor: '#14b143',
              borderColor0: '#ef232a'
            },
          },
          {
            name: 'EMA5',
            type: 'line',
            data: calculateEMA(5,data),
            smooth: true,
            lineStyle: {
              opacity: 0.5,
              color: '#5a6fc0'
            }
          },
          {
            name: 'EMA21',
            type: 'line',
            data: calculateEMA(21,data),
            smooth: true,
            lineStyle: {
              opacity: 0.5,
              color: '#9eca7f'
            }
          },
          {
            name: 'EMA50',
            type: 'line',
            data: calculateEMA(50,data),
            smooth: true,
            lineStyle: {
              opacity: 0.5,
              color: '#f2ca6b'
            }
          },
          {
            name: 'Volume',
            type: 'bar',
            xAxisIndex: 1,
            yAxisIndex: 1,
            data: data.volumes
          }
        ]
      };
      chartInstance.setOption(option, true);
      console.log('Chart update complete');
    } catch (error) {
      console.error('Error updating chart:', error);
      throw error;
    }
  }, []);

  const fetchData = useCallback(async (selectedTimeframe, stockSymbol) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      console.log(`Fetching data for ${stockSymbol}, timeframe: ${selectedTimeframe}`);
      
      const response = await fetch(
        `http://localhost:8080/api/stock-data?timeframe=${selectedTimeframe}&symbol=${stockSymbol}`
      );
      
      if (!response.ok) {
        setError(`Stock "${stockSymbol}" does not exist`);
        setLoading(false);
        return;
      }
      
      const rawData = await response.json();
      console.log('Received raw data:', rawData);
      
      if (!rawData || rawData.length === 0) {
        setError(`No data available for ${stockSymbol}`);
        setLoading(false);
        return;
      }

      const data = splitData(rawData);
      console.log('Processed data:', data);
      
      if (chartRef.current) {
        if (!chart) {
          console.log('Creating new chart instance');
          const newChart = echarts.init(chartRef.current);
          setChart(newChart);
          updateChartOption(newChart, data);
        } else {
          console.log('Updating existing chart instance');
          updateChartOption(chart, data);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError('An unexpected error occurred while fetching data');
      setLoading(false);
    }
  }, [chart, updateChartOption]);

  // Fix the resize event listener
  useEffect(() => {
    const handleResize = () => {
      if (chart) {
        chart.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [chart]);

  // Update timeframe effect
  useEffect(() => {
    fetchData(timeframe, currentSymbol);
  }, [timeframe, currentSymbol, fetchData]);

  // This effect will dispose the chart when the component unmounts.
  useEffect(() => {
    return () => {
      if (chart) {
        console.log('Component unmount: disposing chart instance');
        chart.dispose();
        setChart(null);
      }
    };
  }, [chart]);

  // Add timeframe selection buttons
  const renderTimeframeButtons = () => (
    <div style={{ padding: '8px', marginBottom: '20px', textAlign: 'center' }}>
      {timeframeOptions.map(option => (
        <button
          key={option.value}
          onClick={() => setTimeframe(option.value)}
          style={{
            margin: '0 10px',
            padding: '8px 16px',
            backgroundColor: timeframe === option.value ? '#007bff' : '#f8f9fa',
            color: timeframe === option.value ? 'white' : 'black',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );


  return (
    <div>
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <input
          type="text"
          value={currentSymbol}
          onChange={(e) => setCurrentSymbol(e.target.value.toUpperCase())}
          style={{
            padding: '8px',
            marginRight: '10px',
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          }}
          placeholder="Enter stock symbol"
        />
        {renderTimeframeButtons()}
    </div>
    <div style={{ position: 'relative' }}>
      <div ref={chartRef} style={{ width: '100%', height: '600px' }} />
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          Loading stock data...
        </div>
      )}
    </div>
    {error && <div style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>Error: {error}</div>}
  </div>
);
};

export default StockChart;