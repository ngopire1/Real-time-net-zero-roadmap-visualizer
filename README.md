Carbon Compass — Demo

Lightweight single-page demo for the Carbon Compass net-zero roadmap visualizer.

How to run
1. Open `index.html` in a browser (double-click or use a local static server).
2. Enter a current footprint, yearly reduction %, and years to net-zero. Try the sample data.

Files
- `index.html` — main UI
- `styles.css` — basic styling
- `app.js` — app logic (chart, validation, scenario)
- `sample_data.csv` — example emissions timeseries

Notes
- This is a hackathon-friendly static demo that runs entirely in the browser. No backend required.
# Carbon Compass: Real-Time Net-Zero Roadmap Visualizer

A dynamic, interactive dashboard that helps companies visualize and plan their journey to net-zero emissions using science-based targets.

## 🌟 Features

- **Interactive Dashboard**: Input your current emissions and reduction targets
- **Science-Based Validation**: Instant feedback on target feasibility based on SBTi-aligned benchmarks
- **Dynamic Visualization**: Timeline with checkpoints (2030/2035/2040) showing progress
- **Scenario Planning**: Test different reduction strategies:
  - Renewable energy adoption
  - Energy efficiency improvements
  - Transport optimization
  - Custom reduction scenarios
- **Progress Tracking**: Generate detailed PDF reports with charts and metrics
- **Data Management**: Save and load plans, import historical data via CSV

## 🚀 Quick Start

1. Open `index.html` in your browser
2. Enter your current emissions data:
   - Current footprint (tons CO₂)
   - Yearly reduction target (%)
   - Timeline to net-zero
3. Choose your sector and emissions scope
4. Click "Simulate Pathway" to see your roadmap
5. Try different scenarios to optimize your path

## 💡 Use Cases

- Set science-based emission reduction targets
- Visualize long-term carbon reduction pathways
- Compare different reduction strategies
- Generate progress reports for stakeholders
- Track and validate emissions reduction goals

## 🛠 Technical Details

- **Frontend**: Pure HTML/CSS/JavaScript
- **Visualization**: Chart.js with annotations
- **PDF Generation**: jsPDF
- **Data Storage**: LocalStorage for saving progress
- **CSV Support**: Import historical emissions data

## 📊 Sample Data

The repository includes `sample_data.csv` with example emissions data to help you get started.

## 🌐 Live Demo

Try it now: [Carbon Compass Demo](https://ngopire1.github.io/Real-time-net-zero-roadmap-visualizer/)

## 📝 License

MIT License - Feel free to use and modify!
