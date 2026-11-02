# Quantitative Trading

Propietario: Teo Chiappero

**Author:** Ernest P. Chan

Here are the consolidated notes from your highlights, formatted and structured for easy importing into Notion. The core themes revolve around psychological discipline, the mathematical rigor of backtesting, and the stark realities of market behavior.

## 🧠 Core Philosophy

> “Make everything as simple as possible. But not simpler.”
> 

The beauty of quantitative trading is that it allows you to focus entirely on the product. Unlike traditional businesses where marketing is paramount, your counterparties in financial markets care about one thing only: the price. However, the ultimate viability of any strategy depends heavily on the trader's psychological discipline rather than just the math.

## 📖 Chapter-by-Chapter Breakdown

### Chapter 1: The Whats, Whos, and Whys

- **The Ultimate Solopreneurship:** Quant trading strips away the need for marketing. It is a pure product-focus endeavor.
- **Avoid Manual Intervention:** The urge to meddle with a running strategy is dangerous, especially when you have too much free time.
    - *Actionable Advice:* Step away from the screen. Go to the gym or engage in other healthy activities during trading hours to prevent emotional tampering.

### Chapter 2: Fishing for Ideas

- **The Human Element:** The success or failure of a viable strategy often has less to do with the market and more to do with your own psychological makeup and execution.

### Chapter 3: Backtesting

- **The Tech Stack:** Python is the undisputed de facto language for backtesting, largely thanks to the `numpy` and `pandas` libraries.
- **The Illusion of Perfection:** Erroneous backtests usually inflate historical performance. If it looks too good to be true, it probably is.
- **Critical Pitfalls to Avoid:**
    - **Look-Ahead Bias:** Accidentally using information from the future.
        - *The Fix:* Always use lagged historical data (e.g., calculations based only on data up to the close of the previous trading period).
    - **Data-Snooping Bias:** Over-optimizing your strategy.
        - *The Fix:* Ensure your sample size of backtest data is sufficiently large relative to the number of free parameters you are optimizing.
- **Data Relevance:** Even though stock data goes back a century, only the last 10 years are truly suitable for building predictive models.

### Chapter 6: Money and Risk Management

- **The Psychology of Loss Aversion:** Traders often exit profitable positions prematurely because the psychological pain of potentially losing current profits outweighs the pleasure of maximizing them.
- **Building Tolerance:** Start with a small portfolio. Gradually increase it as you gain discipline, confidence in your models, and the emotional fortitude to handle P&L swings.
- **Trust the Math:** Adhering strictly to the Kelly formula for position sizing is a crucial safeguard against catastrophic portfolio disasters.

### Chapter 7: Special Topics in Quantitative Trading

- **The Calendar Effect (Seasonality):**
    - *Equities:* Buying/selling at fixed dates of the year is mostly a dead strategy in the stock market due to widespread awareness.
    - *Commodities:* Seasonal trading strategies in commodity futures continue to hold profitable opportunities.

### Chapter 8: Conclusion

- **The Cost of Losing:** Rationality is almost always the first casualty when a trader starts losing money.
- **The Agency Problem:** Trading "Other People's Money" (OPM) offers an asymmetric risk profile: unlimited upside for the trader, with the absolute downside simply being getting fired.
- **The Future of Quant:** As long as financial markets require instant liquidity, there will always be a profitable niche for quantitative trading.