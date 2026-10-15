
/* ==============================
   GREENCAMPUS — JAVASCRIPT
============================== */

// Initial sample room data
const initialRooms = [
  {
    room: "B-101 (Computer Lab)",
    electricity: 160,
    water: 1200,
    paper: 450,
    color: "#ff7188"
  },
  {
    room: "B-102 (Classroom)",
    electricity: 90,
    water: 800,
    paper: 200,
    color: "#48bafa"
  },
  {
    room: "B-103 (Office)",
    electricity: 70,
    water: 600,
    paper: 150,
    color: "#35d98b"
  },
  {
    room: "L-102 (Library)",
    electricity: 50,
    water: 400,
    paper: 300,
    color: "#9c7bff"
  },
  {
    room: "Main Building (203)",
    electricity: 120,
    water: 1800,
    paper: 500,
    color: "#f6a04d"
  }
];

const STORAGE_KEY = "greencampus-room-records-v1";

let rooms = loadRooms();
let chart = null;
let currentPeriod = 7;

// Shortcuts for selecting HTML elements
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

// Format numbers using Indian number grouping
const number = (value) =>
  Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 1
  });


// ==============================
// 1. LOAD AND SAVE DATA
// ==============================

function loadRooms() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    return saved
      ? JSON.parse(saved)
      : initialRooms.map(room => ({ ...room }));

  } catch {
    return initialRooms.map(room => ({ ...room }));
  }
}

function saveRooms() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(rooms)
    );
  } catch {
    showToast("Could not save in this browser.");
  }
}


// ==============================
// 2. CALCULATE RESOURCE TOTALS
// ==============================

function totals() {
  return rooms.reduce(
    (sum, room) => ({
      electricity:
        sum.electricity + Number(room.electricity || 0),

      water:
        sum.water + Number(room.water || 0),

      paper:
        sum.paper + Number(room.paper || 0)
    }),
    {
      electricity: 0,
      water: 0,
      paper: 0
    }
  );
}

function renderMetrics() {
  const total = totals();

  $("#electricityTotal").textContent =
    number(total.electricity);

  $("#waterTotal").textContent =
    number(total.water);

  $("#paperTotal").textContent =
    number(total.paper);

  $("#roomCount").textContent =
    `${rooms.length} locations monitored`;
}


// ==============================
// 3. CHECK HIGH RESOURCE USAGE
// ==============================

function isHigh(room) {
  return (
    room.electricity > 140 ||
    room.water > 1500 ||
    room.paper > 600
  );
}


// ==============================
// 4. DISPLAY ROOM TABLE
// ==============================

function renderRooms(filter = "") {
  const filtered = rooms.filter(room =>
    room.room.toLowerCase().includes(
      filter.toLowerCase()
    )
  );

  $("#roomTable").innerHTML = filtered
    .map(room => {
      const high = isHigh(room);

      return `
        <tr>
          <td>
            <span class="room-name">
              <i
                class="room-dot"
                style="background:${room.color || "#35d98b"}"
              ></i>
              ${escapeHTML(room.room)}
            </span>
          </td>

          <td>${number(room.electricity)}</td>
          <td>${number(room.water)}</td>
          <td>${number(room.paper)}</td>

          <td>
            <span class="status ${high ? "high" : "normal"}">
              ${high ? "Review" : "Normal"}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");

  if (filtered.length === 0) {
    $("#roomTable").innerHTML = `
      <tr>
        <td
          colspan="5"
          style="text-align:center;padding:25px;color:#819b8a"
        >
          No matching rooms found.
        </td>
      </tr>
    `;
  }
}


// Safely display text entered by the user
function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]
  );
}


// ==============================
// 5. GENERATE RESOURCE ALERTS
// ==============================

function renderAlerts() {
  const alerts = [];

  rooms.forEach(room => {

    if (room.electricity > 140) {
      alerts.push({
        room: room.room,
        title: "High electricity usage",
        detail:
          `${number(room.electricity)} kWh recorded · review operating hours.`,
        type: "danger"
      });
    }

    if (room.water > 1500) {
      alerts.push({
        room: room.room,
        title: "Unusually high water usage",
        detail:
          `${number(room.water)} L recorded · check for possible leaks.`,
        type: "warning"
      });
    }

    if (room.paper > 600) {
      alerts.push({
        room: room.room,
        title: "Paper usage above threshold",
        detail:
          `${number(room.paper)} sheets recorded · consider digital forms.`,
        type: "warning"
      });
    }

  });

  $("#alertCount").textContent =
    `${alerts.length} active`;

  $("#alertsList").innerHTML = alerts.length
    ? alerts.slice(0, 4).map(alert => `
        <div class="alert-item">

          <span class="alert-symbol ${
            alert.type === "warning" ? "warning" : ""
          }">
            ${alert.type === "danger" ? "!" : "△"}
          </span>

          <div class="alert-copy">
            <strong>${escapeHTML(alert.room)}</strong>

            <p>${escapeHTML(alert.title)}</p>

            <small class="${
              alert.type === "warning" ? "warning-text" : ""
            }">
              ${escapeHTML(alert.detail)}
            </small>
          </div>

        </div>
      `).join("")
    : `
        <div class="alert-item">
          <span class="alert-symbol ok">✓</span>

          <div class="alert-copy">
            <strong>All clear</strong>
            <p>No readings exceed your current thresholds.</p>
            <small class="ok-text">
              Everything is within configured limits.
            </small>
          </div>
        </div>
      `;
}


// ==============================
// 6. CHART DATA
// ==============================

function chartData(period) {

  const labels =
    period === 7
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : period === 30
        ? ["Week 1", "Week 2", "Week 3", "Week 4"]
        : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  const values =
    period === 7
      ? [
          [47, 68, 56, 82, 60, 53, 75],
          [25, 41, 33, 47, 32, 32, 47],
          [10, 20, 15, 20, 15, 17, 20]
        ]
      : period === 30
        ? [
            [210, 235, 220, 260],
            [120, 138, 127, 150],
            [58, 65, 61, 72]
          ]
        : [
            [650, 720, 680, 790, 760, 830],
            [340, 390, 360, 420, 405, 455],
            [170, 190, 180, 205, 198, 220]
          ];

  return { labels, values };
}


// ==============================
// 7. CREATE THE CHART
// ==============================

function initChart() {
  const canvas = $("#usageChart");

  // Show a message if Chart.js is unavailable
  if (!canvas || typeof Chart === "undefined") {
    if (canvas) {
      canvas.parentElement.innerHTML = `
        <p style="color:#9bb8a9">
          Charts need an internet connection to load Chart.js.
        </p>
      `;
    }

    return;
  }

  const data = chartData(currentPeriod);

  chart = new Chart(canvas, {
    type: "line",

    data: {
      labels: data.labels,

      datasets: [
        {
          label: "Electricity",
          data: data.values[0],
          borderColor: "#35d98b",
          backgroundColor: "rgba(53,217,139,.10)",
          fill: true,
          tension: 0.42,
          borderWidth: 2,
          pointRadius: 2.5,
          pointHoverRadius: 5
        },

        {
          label: "Water",
          data: data.values[1],
          borderColor: "#48bafa",
          backgroundColor: "transparent",
          tension: 0.42,
          borderWidth: 2,
          pointRadius: 2.5,
          pointHoverRadius: 5
        },

        {
          label: "Paper",
          data: data.values[2],
          borderColor: "#f6c85f",
          backgroundColor: "transparent",
          tension: 0.42,
          borderWidth: 2,
          pointRadius: 2.5,
          pointHoverRadius: 5
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      animation: {
        duration: 900,
        easing: "easeOutQuart"
      },

      interaction: {
        intersect: false,
        mode: "index"
      },

      plugins: {
        legend: {
          display: false
        },

        tooltip: {
          backgroundColor: "#10271d",
          borderColor: "#34543e",
          borderWidth: 1,
          titleColor: "#eaffef",
          bodyColor: "#b4d1bd",
          padding: 12,
          displayColors: true
        }
      },

      scales: {
        x: {
          grid: {
            color: "rgba(124,166,139,.07)"
          },

          border: {
            display: false
          },

          ticks: {
            color: "#789886",
            font: {
              family: "DM Sans",
              size: 10
            }
          }
        },

        y: {
          beginAtZero: true,

          grid: {
            color: "rgba(124,166,139,.11)"
          },

          border: {
            display: false
          },

          ticks: {
            color: "#789886",
            font: {
              family: "DM Sans",
              size: 10
            },
            maxTicksLimit: 5
          }
        }
      }
    }
  });
}


// Change chart when the user selects 7D, 30D or 3M
function updateChart(period) {
  currentPeriod = period;

  const data = chartData(period);

  if (chart) {
    chart.data.labels = data.labels;

    chart.data.datasets.forEach((dataset, index) => {
      dataset.data = data.values[index];
    });

    chart.update();
  }

  $$(".period").forEach(button => {
    button.classList.toggle(
      "active",
      Number(button.dataset.period) === period
    );
  });
}


// ==============================
// 8. OPEN AND CLOSE THE FORM
// ==============================

function openModal() {
  $("#modalBackdrop").classList.add("open");

  $("#modalBackdrop").setAttribute(
    "aria-hidden",
    "false"
  );

  setTimeout(() => {
    $('input[name="room"]').focus();
  }, 120);
}

function closeModal() {
  $("#modalBackdrop").classList.remove("open");

  $("#modalBackdrop").setAttribute(
    "aria-hidden",
    "true"
  );
}


// ==============================
// 9. SHOW TOAST MESSAGES
// ==============================

let toastTimer;

function showToast(message) {
  const toast = $("#toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}


// ==============================
// 10. EXPORT ROOM DATA TO CSV
// ==============================

function downloadCSV() {
  const headers = [
    "Room",
    "Electricity (kWh)",
    "Water (litres)",
    "Paper (sheets)",
    "Status"
  ];

  const rows = rooms.map(room => [
    room.room,
    room.electricity,
    room.water,
    room.paper,
    isHigh(room) ? "Review" : "Normal"
  ]);

  const csv = [headers, ...rows]
    .map(row =>
      row.map(value =>
        `"${String(value).replace(/"/g, '""')}"`
      ).join(",")
    )
    .join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csv],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "greencampus-resource-report.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  showToast("CSV report downloaded.");
}


// ==============================
// 11. SIDEBAR NAVIGATION
// ==============================

function setPage(page) {
  $("#pageName").textContent = page;

  $$(".nav-link").forEach(link => {
    link.classList.toggle(
      "active",
      link.dataset.page === page
    );
  });

  $("#sidebar").classList.remove("open");

  if (page === "Rooms") {
    $(".rooms-panel").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    showToast("Showing room-wise usage.");

  } else if (page === "Reports") {
    downloadCSV();

  } else if (page === "Resources") {
    $(".metric-grid").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    showToast("Resource overview selected.");

  } else if (page === "Settings") {
    showToast(
      "Demo settings: alert thresholds are configured in script.js."
    );

  } else {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
}


// ==============================
// 12. START THE APPLICATION
// ==============================

function init() {

  // Display the current date
  const now = new Date();

  $("#todayDate").textContent =
    now.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

  // Render initial information
  renderMetrics();
  renderRooms();
  renderAlerts();
  initChart();


  // Chart period buttons
  $$(".period").forEach(button => {
    button.addEventListener("click", () => {
      updateChart(Number(button.dataset.period));
    });
  });


  // Open the add-record form
  $("#addRecordButton").addEventListener(
    "click",
    openModal
  );

  $("#addRecordBottom").addEventListener(
    "click",
    openModal
  );


  // Close the form
  $("#closeModal").addEventListener(
    "click",
    closeModal
  );

  $("#cancelModal").addEventListener(
    "click",
    closeModal
  );

  $("#modalBackdrop").addEventListener(
    "click",
    event => {
      if (event.target === $("#modalBackdrop")) {
        closeModal();
      }
    }
  );

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeModal();
    }
  });


  // Add or update a room record
  $("#usageForm").addEventListener(
    "submit",
    event => {
      event.preventDefault();

      const form = new FormData(event.currentTarget);

      const room = String(form.get("room")).trim();

      if (!room) {
        return showToast("Please enter a room name.");
      }

      const record = {
        room,

        electricity: Number(form.get("electricity")),
        water: Number(form.get("water")),
        paper: Number(form.get("paper")),

        color: [
          "#9bf36d",
          "#48bafa",
          "#35d98b",
          "#9c7bff",
          "#f6a04d"
        ][rooms.length % 5]
      };

      // Validate all resource values
      if (
        [
          record.electricity,
          record.water,
          record.paper
        ].some(value => !Number.isFinite(value) || value < 0)
      ) {
        return showToast(
          "Please enter valid non-negative numbers."
        );
      }

      // Update an existing room or add a new one
      const existing = rooms.findIndex(item =>
        item.room.toLowerCase() === room.toLowerCase()
      );

      if (existing >= 0) {
        rooms[existing] = {
          ...rooms[existing],
          ...record
        };
      } else {
        rooms.unshift(record);
      }

      // Save and refresh the dashboard
      saveRooms();
      renderMetrics();
      renderRooms($("#searchInput").value);
      renderAlerts();

      event.currentTarget.reset();
      closeModal();

      showToast(
        existing >= 0
          ? "Room record updated."
          : "New room record added."
      );
    }
  );


  // Download CSV
  $("#downloadCsv").addEventListener(
    "click",
    downloadCSV
  );


  // Search rooms while typing
  $("#searchInput").addEventListener(
    "input",
    event => {
      renderRooms(event.target.value);
    }
  );


  // Toggle the glow effect
  $("#themeButton").addEventListener(
    "click",
    () => {
      document.body.classList.toggle("glow-mode");

      showToast(
        document.body.classList.contains("glow-mode")
          ? "Glow mode enabled."
          : "Glow mode disabled."
      );
    }
  );


  // Mobile sidebar menu
  $("#mobileMenu").addEventListener(
    "click",
    () => {
      $("#sidebar").classList.toggle("open");
    }
  );


  // Sidebar navigation buttons
  $$(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      setPage(link.dataset.page);
    });
  });

  $$("[data-page-link]").forEach(link => {
    link.addEventListener("click", () => {
      setPage(link.dataset.pageLink);
    });
  });


  // Keyboard shortcut: Ctrl + K or Command + K
  document.addEventListener("keydown", event => {
    if (
      (event.metaKey || event.ctrlKey) &&
      event.key.toLowerCase() === "k"
    ) {
      event.preventDefault();
      $("#searchInput").focus();
    }
  });
}


// Wait until HTML is loaded before running JavaScript
document.addEventListener("DOMContentLoaded", init);
