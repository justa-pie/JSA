let chartType = "songs";
let timePeriod = "day";

const chartList = document.getElementById("chartList");
const statTotal = document.getElementById("statTotal");
const statTop = document.getElementById("statTop");
const statPeriod = document.getElementById("statPeriod");
const periodLabels = {
    day: "Hôm nay",
    week: "Tuần này",
    month: "Tháng này",
    all_time: "Mọi thời đại",
};

document.querySelectorAll("#chartTypeTabs .tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        chartType = btn.dataset.type;
        document
            .querySelectorAll("#chartTypeTabs .tab-btn")
            .forEach((b) => b.classList.toggle("active", b === btn));
        loadChart();
    });
});
document.querySelectorAll("#timePeriodTabs .tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        timePeriod = btn.dataset.period;
        document
            .querySelectorAll("#timePeriodTabs .tab-btn")
            .forEach((b) => b.classList.toggle("active", b === btn));
        statPeriod.textContent = periodLabels[timePeriod];
        loadChart();
    });
});

function showSkeleton() {
    chartList.innerHTML = Array(15)
        .fill(0)
        .map(
            (_, i) => `
    <div class="chart-item">
        <span class="chart-position" style="color:var(--text-3)">${i + 1}</span>
        <div class="skeleton chart-image" style="border-radius:${chartType === "artists" ? "50%" : "8px"}"></div>
        <div class="chart-info">
        <div class="skeleton" style="height:14px;width:58%;margin-bottom:6px"></div>
        <div class="skeleton" style="height:12px;width:38%"></div>
        </div>
    </div>`,
        )
        .join("");
}

async function loadChart() {
    showSkeleton();
    const endpointMap = {
        songs: "/chart/songs/",
        artists: "/chart/artists/",
        albums: "/chart/albums/",
    };
    const cacheKey = `chart_${chartType}_${timePeriod}`;

    try {
        const params = { per_page: 20, page: 1 };
        if (chartType !== "artists") params.time_period = timePeriod;
        if (chartType === "songs") params.type = "all";

        const data = await fetchCached(
            cacheKey,
            endpointMap[chartType],
            params,
        );
        const items = data?.chart_items || [];

        statTotal.textContent = items.length;
        statPeriod.textContent = periodLabels[timePeriod];

        if (!items.length) {
            chartList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-music"></i><h3>Không có dữ liệu</h3></div>`;
            return;
        }

        chartList.innerHTML = items
            .map((c, i) => {
                const r = c.item;
                if (!r) return "";
                const pos = c.chart_position || i + 1;
                const cls = pos <= 3 ? `top-${pos}` : "";
                const trophy =
                    pos === 1
                        ? '<i class="fa-solid fa-trophy" style="color:#fbbf24;font-size:13px"></i>'
                        : pos === 2
                            ? '<i class="fa-solid fa-trophy" style="color:#94a3b8;font-size:13px"></i>'
                            : pos === 3
                            ? '<i class="fa-solid fa-trophy" style="color:#cd7c2f;font-size:13px"></i>'
                            : pos;

                if (chartType === "songs") {
                    if (i === 0) statTop.textContent = r.title || "—";
                    return `<div class="chart-item ${cls} animate-slide-up" style="animation-delay:${Math.min(i, 10) * 0.04}s;cursor:pointer" onclick="window.location.href='details-song.html?id=${r.id}'">
            <span class="chart-position">${trophy}</span>
            <img class="chart-image" src="${safeImg(r.song_art_image_url || r.header_image_url)}" alt="" onerror="this.src='${safeImg()}'"/>
            <div class="chart-info"><div class="chart-title">${r.title}</div><div class="chart-sub">${r.primary_artist?.name || ""}${r.release_date_for_display ? " · " + r.release_date_for_display : ""}</div></div>
            <div class="chart-stats">
            <span class="chart-views"><i class="fa-solid fa-eye" style="font-size:10px;margin-right:3px"></i>${formatNumber(r.stats?.pageviews)}</span>
            ${r.stats?.hot ? '<span class="badge badge-hot" style="font-size:.65rem;padding:2px 6px">HOT</span>' : ""}
            </div>
        </div>`;
                }
                if (chartType === "artists") {
                    if (i === 0) statTop.textContent = r.name || "—";
                    return `<div class="chart-item ${cls} animate-slide-up" style="animation-delay:${Math.min(i, 10) * 0.04}s;cursor:pointer" onclick="window.location.href='details-artist.html?id=${r.id}'">
            <span class="chart-position">${trophy}</span>
            <img class="chart-image artist" src="${safeImg(r.image_url)}" alt="" onerror="this.src='${safeImg()}'"/>
            <div class="chart-info"><div class="chart-title">${r.name}</div><div class="chart-sub">${r.is_verified ? '<i class="fa-solid fa-circle-check" style="color:var(--brand-light);font-size:10px;margin-right:3px"></i>Verified' : "Nghệ sĩ"}</div></div>
            ${r.is_verified ? '<span class="badge badge-brand" style="flex-shrink:0"><i class="fa-solid fa-check"></i></span>' : ""}
        </div>`;
                }
                if (chartType === "albums") {
                    if (i === 0) statTop.textContent = r.name || "—";
                    return `<div class="chart-item ${cls} animate-slide-up" style="animation-delay:${Math.min(i, 10) * 0.04}s;cursor:pointer" onclick="window.location.href='details-album.html?id=${r.id}'">
            <span class="chart-position">${trophy}</span>
            <img class="chart-image" src="${safeImg(r.cover_art_url)}" alt="" onerror="this.src='${safeImg()}'"/>
            <div class="chart-info"><div class="chart-title">${r.name}</div><div class="chart-sub">${r.artist?.name || ""}${r.release_date_components?.year ? " · " + r.release_date_components.year : ""}</div></div>
        </div>`;
                }
            })
            .join("");
    } catch (err) {
        showError(err.message);
        chartList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Lỗi tải dữ liệu</h3><p>${err.message}</p></div>`;
    }
}

loadChart();
