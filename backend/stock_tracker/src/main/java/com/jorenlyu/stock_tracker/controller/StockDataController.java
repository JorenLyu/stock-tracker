package com.jorenlyu.stock_tracker.controller;

import net.jacobpeterson.alpaca.AlpacaAPI;
import net.jacobpeterson.alpaca.model.util.apitype.MarketDataWebsocketSourceType;
import net.jacobpeterson.alpaca.model.util.apitype.TraderAPIEndpointType;
import net.jacobpeterson.alpaca.openapi.marketdata.ApiException;
import net.jacobpeterson.alpaca.openapi.marketdata.model.*;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class StockDataController {
    private final AlpacaAPI alpacaAPI;

    public StockDataController() {
        String keyID = "PK18TV28AID535R5MBJ9";
        String secretKey = "84P2rT35DnDiKBtYbjTU5FizL2xjMkPmyvtrHa1g";
        TraderAPIEndpointType endpointType = TraderAPIEndpointType.LIVE;
        MarketDataWebsocketSourceType sourceType = MarketDataWebsocketSourceType.IEX;
        this.alpacaAPI = new AlpacaAPI(keyID, secretKey, endpointType, sourceType);
    }

    @GetMapping("/stock-data")
    public List<List<Object>> getStockData(
        @RequestParam(defaultValue = "1D") String timeframe,
        @RequestParam(defaultValue = "MSFT") String symbol
    ) {
        List<List<Object>> data = new ArrayList<>();
        
        try {
            System.out.println("Received request for symbol: " + symbol + ", timeframe: " + timeframe);
            
            OffsetDateTime end = LocalDate.now()
                .atStartOfDay()
                .atOffset(ZoneOffset.UTC);
            
            OffsetDateTime start = end.minusDays(365);

            StockBarsRespSingle stockBars = alpacaAPI.marketData().stock().stockBarSingle(
                symbol,              
                timeframe,           
                start,              
                end,                
                10000L,
                StockAdjustment.RAW, 
                null,               
                StockFeed.SIP,      
                "USD",              
                null,               
                null                
            );

            System.out.println("Received bars: " + stockBars.getBars().size());

            stockBars.getBars().forEach(bar -> {
                List<Object> dataPoint = new ArrayList<>();
                dataPoint.add(bar.getT().toString());
                dataPoint.add(bar.getO());
                dataPoint.add(bar.getC());
                dataPoint.add(bar.getL());
                dataPoint.add(bar.getH());
                dataPoint.add(bar.getV());
                data.add(dataPoint);
            });

        } catch (ApiException e) {
            System.err.println("API Error: " + e.getMessage());
            e.printStackTrace();
        }
        
        return data;
    }
} 