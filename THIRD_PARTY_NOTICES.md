# Third-Party Notices & Attribution

This project incorporates and adapts code, datasets, and algorithmic concepts from third-party open-source projects under the terms of their respective licenses.

---

### 1. AgriTech

- **Source Repository:** [https://github.com/kaival775/AgriTech](https://github.com/kaival775/AgriTech)
- **Author / Community:** Kaival Patel and AgriTech contributors
- **Original License:** MIT License

#### Description of Reused & Adapted Components in Ceres:

1. **Crop Yield Prediction (`Crop Yield Prediction`):**
   - Dataset reference and empirical state-level yield distributions for Indian crops across Kharif, Rabi, and Summer/Whole Year seasons.
   - Adapted into an Indian agronomic yield estimation engine with uncertainty bounds and harvest-loss scenario simulation, eliminating circular input requirements.

2. **Fertilizer Recommendation System (`Fertiliser Recommendation System`):**
   - Dataset reference (`fertilizer_dataset.csv`) and NPK decision rules for major fertilizer formulations (Urea, DAP, 14-35-14, 28-28, 17-17-17, 20-20, 10-26-26).
   - Adapted into a multi-factor fertilizer advisory system providing nutrient deficiency diagnosis, application timing, and agronomic explanations without invented dosages.

3. **Crop Prices Tracker (`Crop_Prices_Tracker`):**
   - Integration patterns for the Government of India Open Government Data (data.gov.in) Agmarknet Mandi API (`resource/9ef84268-d588-465a-a308-a864a43d0070`).
   - Adapted into a resilient multi-source provider adapter with cached fallback benchmarks, data freshness indicators (LIVE, CACHED, STALE), and farmer watchlists.

4. **Crop Planning & Plantation Calendar (`Crop_Planning` & `croCalendar.js`):**
   - Sowing and harvesting seasonal timelines for major Indian crops.
   - Adapted into an interactive Seasonal Crop Planner and daily "What Should I Do Today?" agricultural task checklist.

#### MIT License Text:

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
