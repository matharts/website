# 字体资源

网站使用仓库内的 IBM Plex Sans、Noto Sans SC 与 Noto Serif SC 变量字体子集。Astro 通过 `fontProviders.local()` 读取这些文件，生产构建不需要访问 Google Fonts。

字体源来自 [google/fonts](https://github.com/google/fonts)，许可证保存在 `src/assets/fonts/`。字体源和 FontTools 版本记录在 `PROVENANCE.txt` 与 `manifest.json`，更新脚本会拒绝未锁定的版本。字体工具使用 TypeScript 编写，存放在 [`scripts/`](../scripts/)，并由 nub 直接执行。

## 更新字体子集

页面可见文字发生变化后，`nub run fonts:check` 会要求重新生成字体：

```bash
git clone --filter=blob:none --sparse --no-checkout https://github.com/google/fonts.git /tmp/google-fonts
git -C /tmp/google-fonts sparse-checkout set ofl/ibmplexsans ofl/notosanssc ofl/notoserifsc
git -C /tmp/google-fonts fetch --depth 1 origin 389b770410cc0b7c21c85673bfa2077420fe7f65
git -C /tmp/google-fonts checkout --detach 389b770410cc0b7c21c85673bfa2077420fe7f65
nub run fonts:update -- /tmp/google-fonts
```

生成过程需要本机安装 FontTools 4.63.0，并使用 `pyftsubset` 将官方变量字体压缩为只包含站点当前字符的 WOFF2 文件。Sans 字体使用全站字符清单；Serif 字体只收集标题、字标、标签、链接和数据标题，避免把正文全部汉字放入首屏字体。脚本先在临时目录生成全部文件，验证每个子集的字符覆盖和 SHA-256 清单后才替换仓库资源；正常构建不依赖 Python 或 FontTools。
