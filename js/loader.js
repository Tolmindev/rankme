/**
 * RankMe template loader
 * 1. Resolve template id (?t= or filename)
 * 2. Load templates/{id}.js if RANKME_TEMPLATE not set
 * 3. Apply hero / meta / body classes
 * 4. Boot js/app.js
 */
(function () {
  "use strict";

  function qs(id) { return document.getElementById(id); }

  function templateId() {
    var q = new URLSearchParams(location.search).get("t");
    if (q) return q.replace(/[^a-z0-9_-]/gi, "").toLowerCase();
    var path = (location.pathname.split("/").pop() || "").replace(/\.html$/i, "");
    if (path && path !== "tier" && path !== "index" && path !== "create" && path !== "account" && path !== "builder") {
      return path.toLowerCase();
    }
    return "sf-duel";
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.async = false;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error("Failed to load " + src)); };
      document.head.appendChild(s);
    });
  }

  function applyShell(t) {
    if (!t) return;
    var title = t.title || "Tier List";
    document.title = title + " - RankMe";

    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && t.description) {
      metaDesc.setAttribute("content", String(t.description).replace(/<[^>]+>/g, "").slice(0, 160));
    }

    // Cover
    var coverImg = qs("tierCover");
    var host = qs("tierCoverHost");
    if (coverImg && t.cover) {
      coverImg.src = t.cover;
      coverImg.alt = title;
    }
    if (host) {
      host.classList.toggle("has-parallax", !!t.parallax);
    }

    // Description
    var desc = qs("tierDesc");
    if (desc) {
      if (t.descriptionHtml) desc.innerHTML = t.descriptionHtml;
      else if (t.description) desc.textContent = t.description;
    }

    // Experts block
    var expertsWrap = qs("expertsBlock");
    if (expertsWrap) {
      var list = Array.isArray(t.experts) ? t.experts : [];
      if (!list.length) {
        expertsWrap.hidden = true;
      } else {
        expertsWrap.hidden = false;
        var strip = qs("expertsStrip");
        if (strip) {
          strip.innerHTML = "";
          list.forEach(function (ex) {
            var card = document.createElement("div");
            card.className = "expert-card";
            var name = document.createElement("a");
            name.className = "expert-name";
            name.href = ex.href || "#";
            name.textContent = ex.name || "Expert";
            if (ex.id) name.dataset.expertId = ex.id;
            card.appendChild(name);
            if (ex.youtube) {
              var yt = document.createElement("a");
              yt.className = "expert-yt";
              yt.href = ex.youtube;
              yt.target = "_blank";
              yt.rel = "noopener";
              yt.title = "YouTube";
              yt.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.8 15.5v-7l6.2 3.5-6.2 3.5z"/></svg>';
              card.appendChild(yt);
            }
            strip.appendChild(card);
          });
        }
      }
    }

    // Body theme classes (app.js also sets these; set early for FOUC)
    if (t.cardShape === "square") document.body.classList.add("card-square");
    if (t.theme === "gold") document.body.classList.add("theme-gold");
    if (t.noFactions) document.body.classList.add("no-factions");
  }

  function bindCoverParallax() {
    var mobile = window.matchMedia && window.matchMedia("(max-width: 720px), (hover: none)").matches;
    if (mobile) return;
    document.querySelectorAll(".parallax-host.has-parallax").forEach(function (host) {
      var img = host.querySelector("img");
      if (!img) return;
      var max = 12;
      host.addEventListener("pointermove", function (e) {
        var r = host.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        img.style.transform = "scale(1.12) translate3d(" + (-px * max * 2).toFixed(1) + "px," + (-py * max * 2).toFixed(1) + "px,0)";
      });
      host.addEventListener("pointerleave", function () {
        img.style.transform = "scale(1.08) translate3d(0,0,0)";
      });
    });
  }

  async function boot() {
    var id = templateId();
    window.RANKME_TEMPLATE_ID = id;

    if (!window.RANKME_TEMPLATE && id) {
      try {
        await loadScript("templates/" + id + ".js");
      } catch (e) {
        console.warn("Template load failed:", id, e);
      }
    }

    // Blank mode for create flow
    if (id === "blank" || new URLSearchParams(location.search).get("blank") === "1") {
      window.RANKME_BLANK = true;
    }

    applyShell(window.RANKME_TEMPLATE || null);
    bindCoverParallax();

    try {
      await loadScript("js/app.js");
    } catch (e) {
      console.error(e);
      var d = qs("tierDesc");
      if (d) d.textContent = "Failed to load app. Hard-refresh or check js/app.js.";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
