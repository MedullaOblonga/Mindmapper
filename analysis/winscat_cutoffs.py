#!/usr/bin/env python3
"""Derive the "outside your usual" cutoffs for the Body trends tab from NASA records.

Inputs
  1. WinSCAT, NASA Life Sciences Portal experiment MR085G (Flight Analogs bed-rest
     Campaigns 1 and 3). Pass the extracted folder as the first argument. The raw
     files are not committed; download them from https://nlsp.nasa.gov/.
  2. ARES simple reaction time, one bed-rest volunteer, already in the repo at
     src/data/nasa/check_history.json (LSDA, DOI 10.83263/7081-d617).

Every volunteer was healthy, so a session that crosses a cutoff is a false alert.
The cutoffs are therefore set by the false-alert rate they give in these records.
They say nothing about sensitivity: no record here contains a known impairment.

Run:  python3 -I analysis/winscat_cutoffs.py /path/to/MR085G  [out.json]
"""
import glob
import json
import os
import sys

import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "..", "src", "data", "nasa", "body_cutoffs.json")
ARES = os.path.join(HERE, "..", "src", "data", "nasa", "check_history.json")
RNG = np.random.default_rng(2026)
N_BOOT = 4000
TARGET = 0.05  # single-session false-alert rate the cutoff is set to


def load_winscat(folder):
    frames = []
    for path in sorted(glob.glob(os.path.join(folder, "MR085G_Campaign_3_WinSCAT", "*"))):
        d = pd.read_csv(path)
        d["person"] = d["Campaign"].astype(str) + "_" + d["Subject"].astype(str).str.zfill(4)
        frames.append(d)
    d = pd.read_csv(os.path.join(folder, "MR085G_Campaign_1_WinSCAT", "MR085G_Campaign_1_WinSCAT_All"), encoding="utf-8-sig")
    d["person"] = d["Subject"].astype(str)
    frames.append(d)
    df = pd.concat(frames, ignore_index=True)
    df["speed"] = 1000.0 / df["CPTRT"]  # running-memory responses per second
    return df.sort_values(["person", "Run"]).reset_index(drop=True)


def people(df):
    """Per person: own usual = mean of the last three sessions before bed rest (NASA's WinSCAT convention)."""
    out = []
    for pid, g in df.groupby("person", sort=True):
        pre, later = g[g.Test_Phase == "PRE_TEST"], g[g.Test_Phase != "PRE_TEST"]
        if len(pre) < 3 or len(later) < 1:
            continue
        base = pre["speed"].tail(3).mean()
        out.append({"id": pid, "base": base, "pct": ((later["speed"] - base) / base).to_numpy()})
    return out


def ci(xs):
    lo, hi = np.percentile(xs, [2.5, 97.5])
    return [round(float(lo), 4), round(float(hi), 4)]


def boot(ppl, fn):
    n = len(ppl)
    return ci([fn([ppl[i] for i in RNG.integers(0, n, n)]) for _ in range(N_BOOT)])  # resample whole people


def pooled(ppl):
    return np.concatenate([p["pct"] for p in ppl])


def rate_single(ppl, cut):
    return float(np.mean(pooled(ppl) < -cut))


def rate_two(ppl, cut):
    """Share of consecutive session pairs in which both sit below the line."""
    hits = tot = 0
    for p in ppl:
        o = p["pct"] < -cut
        tot += max(0, len(o) - 1)
        hits += int(np.sum(o[1:] & o[:-1]))
    return hits / tot if tot else 0.0


def ares_rule(cut):
    """The same percent line on one volunteer's 155 simple reaction-time sessions.
    Own usual = median of the first 12 kept sessions; the later sessions are judged against it."""
    s = json.load(open(ARES))["sessions"]
    v = np.array([1000.0 / x["meanRtMs"] for x in s])
    ref, test = v[:12], v[12:]
    out = test < np.median(ref) * (1 - cut)
    return {"sessions": int(len(test)), "single": round(float(out.mean()), 4),
            "twoInRow": round(float((out[1:] & out[:-1]).mean()), 4)}


def main():
    df = load_winscat(SRC)
    ppl = people(df)
    allpct = pooled(ppl)
    cut = float(-np.quantile(allpct, TARGET))   # slowing exceeded by 5% of healthy sessions
    res = {
        "source": "NASA Life Sciences Portal, experiment MR085G, WinSCAT, Flight Analogs bed-rest Campaigns 1 and 3",
        "method": "Running-memory response speed (1000 / CPTRT). Own usual = mean of the last three sessions before bed rest. "
                  "Later sessions (during and after bed rest) are expressed as percent change from own usual. "
                  "Intervals are 95% percentile bootstrap intervals, resampling whole people.",
        "people": len(ppl), "peopleInFiles": int(df.person.nunique()), "laterSessions": int(len(allpct)),
        "medianPctChange": round(float(np.median(allpct)), 4),
        "targetSingleRate": TARGET,
        "speedDropCut": round(cut, 4), "speedDropCutCI": boot(ppl, lambda q: float(-np.quantile(pooled(q), TARGET))),
        "atCut": {"single": round(rate_single(ppl, cut), 4), "singleCI": boot(ppl, lambda q: rate_single(q, cut)),
                  "twoInRow": round(rate_two(ppl, cut), 4), "twoInRowCI": boot(ppl, lambda q: rate_two(q, cut))},
        "at20pct": {"single": round(rate_single(ppl, 0.20), 4), "singleCI": boot(ppl, lambda q: rate_single(q, 0.20))},
    }
    res["ares"] = {"source": "LSDA Bed Rest Standard Measures, ARES simple reaction time, one volunteer (DOI 10.83263/7081-d617)",
                   **ares_rule(round(cut, 2))}
    with open(OUT, "w") as f:
        json.dump(res, f, indent=2)
        f.write("\n")
    print(json.dumps(res, indent=2))


if __name__ == "__main__":
    main()
