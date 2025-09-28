// Carbon Compass - app logic
const ctx = document.getElementById('roadmap').getContext('2d');

function linearProjection(current, reductionPct, years){
  const pts = [];
  let value = current;
  for(let y=0;y<=years;y++){
    pts.push(Number(value.toFixed(2)));
    value = value * (1 - reductionPct/100);
  }
  return pts;
}

// SBTi-aligned sector benchmarks (simplified)
const SECTOR_BENCHMARKS = {
  'high-impact': { // e.g., energy, heavy industry
    near_term_min: 4.2, // % reduction per year
    long_term_min: 2.5,
    description: 'Energy/heavy industry sector'
  },
  'medium-impact': { // e.g., light manufacturing
    near_term_min: 2.5,
    long_term_min: 2.0,
    description: 'Light manufacturing/processing'
  },
  'low-impact': { // e.g., services
    near_term_min: 2.0,
    long_term_min: 1.5,
    description: 'Services/low-impact sector'
  }
};

function evaluateFeasibility(reductionPct, years, current, scope='1'){
  const startYear = new Date().getFullYear();
  const targetYear = startYear + years;
  
  // Get relevant benchmark based on scope
  const benchmark = scope === '1' ? SECTOR_BENCHMARKS['high-impact'] :
                   scope === '2' ? SECTOR_BENCHMARKS['medium-impact'] :
                   SECTOR_BENCHMARKS['low-impact'];

  // Compute key metrics
  const by2030Years = Math.max(0, 2030 - startYear);
  const projected2030 = current * Math.pow(1 - reductionPct/100, by2030Years);
  const pctReductionBy2030 = ((current - projected2030) / current) * 100;
  
  // Evaluate against SBTi-aligned criteria
  const nearTermRate = pctReductionBy2030 / by2030Years;
  const longTermRate = (years > by2030Years) ? 
    (100 - pctReductionBy2030) / (years - by2030Years) : nearTermRate;

  // Build detailed feedback
  let status = 'green';
  const feedback = [];
  
  if(nearTermRate < benchmark.near_term_min) {
    status = 'red';
    feedback.push(`Near-term reduction (${nearTermRate.toFixed(1)}%/year) below ${benchmark.description} minimum (${benchmark.near_term_min}%/year)`);
  }
  
  if(longTermRate < benchmark.long_term_min) {
    status = status === 'green' ? 'yellow' : status;
    feedback.push(`Long-term reduction (${longTermRate.toFixed(1)}%/year) below sustained minimum (${benchmark.long_term_min}%/year)`);
  }

  if(targetYear > 2050) {
    status = status === 'green' ? 'yellow' : status;
    feedback.push('Timeline extends beyond 2050 Paris Agreement target');
  }

  const colors = {
    green: '#16a34a',
    yellow: '#eab308',
    red: '#dc2626'
  };

  const statusLabels = {
    green: 'Ambitious',
    yellow: 'Moderate',
    red: 'Needs Review'
  };

  return {
    label: `${statusLabels[status]} — ${feedback.join('; ')}`,
    color: colors[status],
    metrics: {
      by2030: pctReductionBy2030,
      nearTermRate,
      longTermRate
    }
  };
}

function csvToSeries(text){
  const lines = text.split(/\r?\n/).filter(Boolean);
  const data = lines.map(l=>{
    const [year,val] = l.split(',').map(s=>s.trim());
    return {year:Number(year),value:Number(val)};
  });
  data.sort((a,b)=>a.year-b.year);
  return data;
}

let roadmapChart = null;

// Milestone definitions for the roadmap
const MILESTONES = {
  2025: {
    label: '2025 Checkpoint',
    description: 'Near-term target alignment check'
  },
  2030: {
    label: '2030 Milestone',
    description: 'Science-based interim target'
  },
  2035: {
    label: '2035 Progress',
    description: 'Long-term reduction assessment'
  },
  2040: {
    label: '2040 Target',
    description: 'Major reduction milestone'
  },
  2050: {
    label: '2050 Deadline',
    description: 'Paris Agreement target year'
  }
};

function renderChart(labels, proj, actual=[]){
  if(roadmapChart) roadmapChart.destroy();
  
  // Compute reductions for tooltip
  const reductions = proj.map((val, i) => {
    if(i === 0) return 0;
    return ((proj[i-1] - val) / proj[i-1] * 100).toFixed(1);
  });

  // Setup milestone markers and annotations
  const annotations = {};
  labels.forEach((lab,i)=>{
    const yr = Number(lab);
    if(MILESTONES[yr]){
      annotations[`m${yr}`] = {
        type: 'line',
        xMin: i,
        xMax: i,
        borderColor: '#9ca3af',
        borderWidth: 1,
        borderDash: [4,4],
        label: {
          enabled: true,
          content: MILESTONES[yr].label,
          position: 'start',
          color: '#cbd5e1',
          font: {
            size: 11
          }
        }
      };
    }
  });

  roadmapChart = new Chart(ctx,{
    type:'line',
    data:{
      labels,
      datasets:[
        {
          label:'Projected Path',
          data: proj,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.12)',
          fill: true,
          tension: 0.1
        },
        {
          label:'Actual Emissions',
          data: actual,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249,115,22,0.06)',
          fill: true,
          tension: 0.1
        }
      ]
    },
    options:{
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      layout: {
        padding: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: 'Emissions (tons CO₂)',
            color: '#94a3b8'
          },
          grid: {
            color: 'rgba(255,255,255,0.03)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Target Year',
            color: '#94a3b8'
          },
          grid: {
            color: 'rgba(255,255,255,0.03)'
          }
        }
      },
      plugins: {
        tooltip: {
          enabled: true,
          mode: 'index',
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const reduction = reductions[context.dataIndex];
              const label = context.dataset.label;
              const yearData = MILESTONES[labels[context.dataIndex]];
              
              let lines = [`${label}: ${value.toFixed(0)} tons`];
              if(reduction > 0) {
                lines.push(`Reduction: ${reduction}% from previous year`);
              }
              if(yearData) {
                lines.push(`Note: ${yearData.description}`);
              }
              return lines;
            }
          }
        },
        annotation: {
          annotations
        },
        legend: {
          labels: {
            color: '#94a3b8'
          }
        }
      }
    }
  });
}

function generateLabels(startYear, years){
  const labels = [];
  for(let i=0;i<=years;i++) labels.push(String(startYear + i));
  return labels;
}

// UI bindings
document.getElementById('simulate').addEventListener('click',()=>{
  // Get all input values
  const current = Number(document.getElementById('current').value || 0);
  const reduction = Number(document.getElementById('reduction').value || 0);
  const years = Number(document.getElementById('years').value || 20);
  const scope = document.getElementById('scope').value;
  const sector = document.getElementById('sector').value;
  const startYear = new Date().getFullYear();

  // Generate projection and labels
  const proj = linearProjection(current, reduction, years);
  const labels = generateLabels(startYear, years);

  // Evaluate feasibility with enhanced metrics
  const feas = evaluateFeasibility(reduction, years, current, scope);
  
  // Update validation panel
  const meter = document.getElementById('meter-value');
  meter.textContent = feas.label;
  meter.style.color = feas.color;

  // Update validation metrics
  document.getElementById('reduction-2030').textContent = 
    `${feas.metrics.by2030.toFixed(1)}%`;
  document.getElementById('near-term-rate').textContent = 
    `${feas.metrics.nearTermRate.toFixed(1)}%/year`;
  document.getElementById('long-term-rate').textContent = 
    `${feas.metrics.longTermRate.toFixed(1)}%/year`;

  // Render chart with empty actual data
  renderChart(labels, proj, []);
});

document.getElementById('csvfile').addEventListener('change',async (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const txt = await f.text();
  const series = csvToSeries(txt);
  const years = series[series.length-1].year - series[0].year;
  const labels = series.map(s=>String(s.year));
  const actual = series.map(s=>s.value);

  // compute projection from first point using current reduction input
  const current = actual[0];
  const reduction = Number(document.getElementById('reduction').value||5);
  const proj = linearProjection(current,reduction,years);

  renderChart(labels,proj,actual);
});

document.getElementById('apply-scenario').addEventListener('click',()=>{
  // simple scenario: immediate percent drop next year
  const percent = Number(document.getElementById('renewables').value||0);
  if(!roadmapChart) { alert('Simulate first'); return; }
  const proj = roadmapChart.data.datasets[0].data.slice();
  if(proj.length<2) return;
  proj[1] = proj[1] * (1 - percent/100);
  // smooth subsequent years by applying same annual reduction implied by original series
  for(let i=2;i<proj.length;i++){
    const r = proj[i]/proj[i-1];
    proj[i] = proj[i-1]*r;
  }
  roadmapChart.data.datasets[0].data = proj;
  roadmapChart.update();
});

document.getElementById('save').addEventListener('click',()=>{
  const payload = {
    current:document.getElementById('current').value,
    reduction:document.getElementById('reduction').value,
    years:document.getElementById('years').value,
    scope:document.getElementById('scope').value
  };
  localStorage.setItem('carbon-compass',JSON.stringify(payload));
  alert('Saved locally');
});

document.getElementById('load').addEventListener('click',()=>{
  const raw = localStorage.getItem('carbon-compass');
  if(!raw) { alert('Nothing saved'); return; }
  const p = JSON.parse(raw);
  document.getElementById('current').value = p.current;
  document.getElementById('reduction').value = p.reduction;
  document.getElementById('years').value = p.years;
  document.getElementById('scope').value = p.scope;
  alert('Loaded');
});

document.getElementById('report').addEventListener('click', async ()=>{
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Get current values
  const current = Number(document.getElementById('current').value || 0);
  const reduction = Number(document.getElementById('reduction').value || 0);
  const years = Number(document.getElementById('years').value || 20);
  const scope = document.getElementById('scope').value;
  const sector = document.getElementById('sector').value;
  const start = new Date().getFullYear();
  
  // Get validation results
  const validation = evaluateFeasibility(reduction, years, current, scope);
  
  // Title
  doc.setFontSize(20);
  doc.text('Net-Zero Readiness Report', 20, 20);
  
  // Basic Info
  doc.setFontSize(12);
  doc.text([
    `Generated: ${new Date().toLocaleString()}`,
    `Sector: ${document.getElementById('sector').options[document.getElementById('sector').selectedIndex].text}`,
    `Emissions Scope: ${document.getElementById('scope').options[document.getElementById('scope').selectedIndex].text}`,
  ], 20, 35);
  
  // Current Status
  doc.setFontSize(14);
  doc.text('Current Status', 20, 60);
  doc.setFontSize(12);
  doc.text([
    `Current Emissions: ${current.toLocaleString()} tons CO₂`,
    `Target Annual Reduction: ${reduction}%`,
    `Timeline: ${years} years (${start} to ${start + years})`,
    `Target Year: ${start + years}`,
  ], 20, 70);
  
  // Feasibility Assessment
  doc.setFontSize(14);
  doc.text('Feasibility Assessment', 20, 100);
  doc.setFontSize(12);
  
  // Color-coded status
  const statusColor = validation.color === '#16a34a' ? [22, 163, 74] : 
                     validation.color === '#eab308' ? [234, 179, 8] : 
                     [220, 38, 38];
  doc.setTextColor(...statusColor);
  doc.text(validation.label, 20, 110);
  doc.setTextColor(0);
  
  // Key Metrics
  doc.text([
    `Reduction by 2030: ${validation.metrics.by2030.toFixed(1)}%`,
    `Near-term Rate: ${validation.metrics.nearTermRate.toFixed(1)}%/year`,
    `Long-term Rate: ${validation.metrics.longTermRate.toFixed(1)}%/year`,
  ], 20, 120);
  
  // Scenarios Table
  if(scenarios.length > 0) {
    doc.setFontSize(14);
    doc.text('Applied Scenarios', 20, 150);
    
    const scenarioData = scenarios.map(s => [
      s.name,
      s.type,
      `${s.impact}%`,
      s.fromYear
    ]);
    
    doc.autoTable({
      startY: 160,
      head: [['Name', 'Type', 'Impact', 'Start Year']],
      body: scenarioData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
  }
  
  // Projections Table
  const proj = baselineProjection || linearProjection(current, reduction, years);
  const labels = projectionLabels || generateLabels(start, years);
  
  const projectionData = labels.map((year, i) => [
    year,
    Math.round(proj[i]).toLocaleString(),
    i > 0 ? ((proj[i-1] - proj[i]) / proj[i-1] * 100).toFixed(1) + '%' : '-'
  ]);
  
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Emissions Projection', 20, 20);
  
  doc.autoTable({
    startY: 30,
    head: [['Year', 'Projected Emissions (tons)', 'Reduction vs Previous']],
    body: projectionData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }
  });
  
  // Add chart
  const chartCanvas = document.getElementById('roadmap');
  const chartImage = chartCanvas.toDataURL('image/png');
  const imgWidth = 170;
  const imgHeight = (chartCanvas.height * imgWidth) / chartCanvas.width;
  
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Emissions Reduction Pathway', 20, 20);
  doc.addImage(chartImage, 'PNG', 20, 30, imgWidth, imgHeight);
  
  // Save PDF
  doc.save('net-zero-readiness-report.pdf');
});

// Scenario management
let scenarios = [];
let baselineProjection = null;
let projectionLabels = null;

function applyIntervention(projection, impact, fromYear, type) {
  const result = [...projection];
  const startIdx = projectionLabels.findIndex(year => year === String(fromYear));
  
  if(startIdx === -1) return result;

  for(let i = startIdx; i < result.length; i++) {
    switch(type) {
      case 'renewable':
        // One-time reduction from renewable switch
        if(i === startIdx) {
          result[i] = result[i] * (1 - impact/100);
        } else {
          // Maintain same reduction rate from previous projection
          const ratio = result[i]/result[i-1];
          result[i] = result[i-1] * ratio;
        }
        break;
      
      case 'efficiency':
        // Compound efficiency improvements
        result[i] = result[i] * (1 - (impact/100) * (i - startIdx + 1));
        break;
      
      case 'transport':
        // Step reduction with diminishing returns
        const years = i - startIdx + 1;
        const diminished = impact * (1 / Math.sqrt(years));
        result[i] = result[i] * (1 - diminished/100);
        break;
      
      case 'custom':
        // Simple percentage reduction
        result[i] = result[i] * (1 - impact/100);
        break;
    }
  }
  
  return result;
}

function updateScenarioList() {
  const list = document.getElementById('scenario-list');
  list.innerHTML = '';
  
  scenarios.forEach((scenario, idx) => {
    const card = document.createElement('div');
    card.className = 'scenario-card';
    
    const info = document.createElement('div');
    info.className = 'info';
    
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = scenario.name;
    
    const details = document.createElement('div');
    details.className = 'details';
    details.textContent = `${scenario.impact}% ${scenario.type} from ${scenario.fromYear}`;
    
    info.appendChild(name);
    info.appendChild(details);
    
    const actions = document.createElement('div');
    actions.className = 'actions';
    
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = () => {
      scenarios.splice(idx, 1);
      updateScenarioList();
      updateChart();
    };
    
    actions.appendChild(removeBtn);
    card.appendChild(info);
    card.appendChild(actions);
    list.appendChild(card);
  });
}

function updateChart() {
  if(!baselineProjection) return;
  
  // Start with baseline
  let currentProj = [...baselineProjection];
  
  // Apply each scenario in sequence
  scenarios.forEach(scenario => {
    currentProj = applyIntervention(
      currentProj,
      scenario.impact,
      scenario.fromYear,
      scenario.type
    );
  });
  
  // Update chart with new projection
  renderChart(projectionLabels, currentProj, []);
}

// Populate year dropdown when simulation runs
function updateYearDropdown() {
  const select = document.getElementById('intervention-year');
  select.innerHTML = '';
  
  if(!projectionLabels) return;
  
  projectionLabels.forEach(year => {
    const opt = document.createElement('option');
    opt.value = year;
    opt.textContent = year;
    select.appendChild(opt);
  });
}

document.getElementById('add-scenario').addEventListener('click', () => {
  const name = document.getElementById('scenario-name').value;
  const type = document.getElementById('intervention-type').value;
  const impact = Number(document.getElementById('intervention-impact').value);
  const fromYear = document.getElementById('intervention-year').value;
  
  if(!name || impact <= 0) {
    alert('Please enter a scenario name and impact percentage');
    return;
  }
  
  scenarios.push({name, type, impact, fromYear});
  updateScenarioList();
  updateChart();
  
  // Clear inputs
  document.getElementById('scenario-name').value = '';
  document.getElementById('intervention-impact').value = '20';
});

document.getElementById('clear-scenarios').addEventListener('click', () => {
  scenarios = [];
  updateScenarioList();
  updateChart();
});

// Update simulation to store baseline
const originalSimulate = document.getElementById('simulate').onclick;
document.getElementById('simulate').onclick = () => {
  // Get projection from original simulate
  const current = Number(document.getElementById('current').value || 0);
  const reduction = Number(document.getElementById('reduction').value || 0);
  const years = Number(document.getElementById('years').value || 20);
  const startYear = new Date().getFullYear();
  
  baselineProjection = linearProjection(current, reduction, years);
  projectionLabels = generateLabels(startYear, years);
  
  // Clear scenarios on new simulation
  scenarios = [];
  updateScenarioList();
  
  // Update year dropdown
  updateYearDropdown();
  
  // Run original simulation
  originalSimulate();
};

// Auto-simulate initial state
document.getElementById('simulate').click();
