package com.jorenlyu.stock_tracker;

import net.jacobpeterson.alpaca.AlpacaAPI;
import net.jacobpeterson.alpaca.model.util.apitype.MarketDataWebsocketSourceType;
import net.jacobpeterson.alpaca.model.util.apitype.TraderAPIEndpointType;
import net.jacobpeterson.alpaca.model.websocket.marketdata.streams.stock.model.trade.StockTradeMessage;
import net.jacobpeterson.alpaca.openapi.marketdata.ApiException;
import net.jacobpeterson.alpaca.openapi.marketdata.model.*;
import net.jacobpeterson.alpaca.websocket.marketdata.streams.stock.StockMarketDataListenerAdapter;

import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

public class testHTTP {
    static final String keyID = "PK18TV28AID535R5MBJ9";
    static final String secretKey = "84P2rT35DnDiKBtYbjTU5FizL2xjMkPmyvtrHa1g";
    static final TraderAPIEndpointType endpointType = TraderAPIEndpointType.LIVE; // or 'LIVE'
    static final MarketDataWebsocketSourceType sourceType = MarketDataWebsocketSourceType.IEX; // or 'SIP'
    static final AlpacaAPI alpacaAPI = new AlpacaAPI(keyID, secretKey, endpointType, sourceType);

    public static void main(String[] args) throws InterruptedException, ApiException {
        // Print out the latest Tesla trade
        final StockTrade latestTSLATrade = alpacaAPI.marketData().stock()
                .stockLatestTradeSingle("TSLA", StockFeed.IEX, null).getTrade();
        System.out.printf("Latest TSLA trade: price=%s, size=%s\n",
                latestTSLATrade.getP(), latestTSLATrade.getS());

        try {
            // Set up specific dates for the stock data query
            OffsetDateTime start = LocalDate.of(2025, 1, 1)
                .atStartOfDay()
                .atOffset(ZoneOffset.UTC);
            
            OffsetDateTime end = LocalDate.of(2025, 1, 28)
                .atStartOfDay()
                .atOffset(ZoneOffset.UTC);

            // Query MSFT stock data
            StockBarsRespSingle msftBars = alpacaAPI.marketData().stock().stockBarSingle(
                "MSFT",              // symbol
                "1Day",              // timeframe (1-day bars)
                start,                // start date
                end,                  // end date
                1000L,                // limit to 1000 results
                StockAdjustment.RAW,   // adjustment (default: raw)
                null,                 // asof (using default)
                StockFeed.SIP,        // feed
                "USD",               // currency
                null,                 // pageToken (no pagination)
                null     // sort in descending order
            );

            // Print the stock data results
            System.out.println("MSFT Stock Data for Jan 2025:");
            msftBars.getBars().forEach(bar -> {
                System.out.printf("Date: %s%n" +
                                 "Open: %.2f, Close: %.2f%n" +
                                 "High: %.2f, Low: %.2f%n" +
                                 "Volume: %d, Volume weighted average price: %.2f%n%n",
                    bar.getT(),  // Timestamp
                    bar.getO(),  // Open price
                    bar.getC(),  // Close price
                    bar.getH(),  // High price
                    bar.getL(),  // Low price
                    bar.getV(),  // Volume
                    bar.getVw()); // Volume weighted average price
            });
        } catch (ApiException e) {
            System.err.println("Error fetching stock data: " + e.getMessage());
        }


    
        // Print out the highest Bitcoin ask price on the order book
        final CryptoOrderbook latestBitcoinOrderBooks = alpacaAPI.marketData().crypto()
                .cryptoLatestOrderbooks(CryptoLoc.US, "BTC/USD").getOrderbooks().get("BTC/USD");
        final Double highestBitcoinAskPrice = latestBitcoinOrderBooks.getA().stream()
                .map(CryptoOrderbookEntry::getP)
                .max(Double::compare)
                .orElse(null);
        System.out.println("Bitcoin highest ask price: " + highestBitcoinAskPrice);





        // Connect to the 'stock market data' stream and wait until it's authorized
        alpacaAPI.stockMarketDataStream().connect();
        if (!alpacaAPI.stockMarketDataStream().waitForAuthorization(5, TimeUnit.SECONDS)) {
            throw new RuntimeException("Failed to authorize within 5 seconds");
        }

        // Print out trade messages
        alpacaAPI.stockMarketDataStream().setListener(new StockMarketDataListenerAdapter() {
            @Override
            public void onTrade(StockTradeMessage trade) {
                System.out.println("Received trade: " + trade);
            }
        });

        // Subscribe to AAPL trades
        alpacaAPI.stockMarketDataStream().setTradeSubscriptions(Set.of("AAPL"));
        System.out.println("Subscribed to Apple trades.");

        // Wait a few seconds
        Thread.sleep(5000);

        // Unsubscribe from AAPL and subscribe to TSLA and MSFT
        alpacaAPI.stockMarketDataStream().setTradeSubscriptions(Set.of("TSLA", "MSFT"));
        System.out.println("Subscribed to Tesla and Microsoft trades.");

        // Wait a few seconds
        Thread.sleep(5000);

        // Disconnect the 'stock market data' stream and exit cleanly
        alpacaAPI.stockMarketDataStream().disconnect();
        alpacaAPI.closeOkHttpClient();
    }
}
