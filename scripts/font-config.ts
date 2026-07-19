export const googleFontsRevision = "389b770410cc0b7c21c85673bfa2077420fe7f65";
export const fontToolsVersion = "4.63.0";

export interface FontConfig {
  source: string;
  output: string;
  glyphManifest: string;
  license: string;
  licenseOutput: string;
}

export const fonts = [
  {
    source: "ofl/ibmplexsans/IBMPlexSans[wdth,wght].ttf",
    output: "ibm-plex-sans.woff2",
    glyphManifest: "glyphs.txt",
    license: "ofl/ibmplexsans/OFL.txt",
    licenseOutput: "OFL-IBM-Plex-Sans.txt"
  },
  {
    source: "ofl/notosanssc/NotoSansSC[wght].ttf",
    output: "noto-sans-sc.woff2",
    glyphManifest: "glyphs.txt",
    license: "ofl/notosanssc/OFL.txt",
    licenseOutput: "OFL-Noto-Sans-SC.txt"
  },
  {
    source: "ofl/notoserifsc/NotoSerifSC[wght].ttf",
    output: "noto-serif-sc.woff2",
    glyphManifest: "serif-glyphs.txt",
    license: "ofl/notoserifsc/OFL.txt",
    licenseOutput: "OFL-Noto-Serif-SC.txt"
  }
] satisfies FontConfig[];
