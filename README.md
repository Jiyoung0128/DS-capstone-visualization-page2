# DS-capstone-visualization-page2

렘피카 가격 정책 시각화 **Page 2** — uncalibrated CatBoost depth=3, 1만~20만원 grid.

**Pages URL (배포 후):** https://jiyoung0128.github.io/DS-capstone-visualization-page2/

## GitHub Pages 배포

1. GitHub에서 빈 저장소 `DS-capstone-visualization-page2` 생성 (Public)
2. Settings → Pages → Source: **Deploy from branch** → `main` / `/ (root)`
3. 로컬에서 push:

```powershell
cd "$env:USERPROFILE\OneDrive\문서\GitHub\DS-capstone-visualization-page2"
git remote add origin https://github.com/Jiyoung0128/DS-capstone-visualization-page2.git
git push -u origin main
```

## 데이터 갱신 (DS-capstone-travel에서)

```powershell
.\step6_Policy_Visualization2\scripts\sync_public_pages.ps1 -Push
```
