interface NavigationItem {
  id: "about" | "work" | "building" | "method" | "participate";
  railLabel: string;
  mobileLabel: string;
  search: {
    title: string;
    detail: string;
    keys: string;
    url?: string;
  };
}

interface Project {
  title: string;
  description: string;
  searchDetail: string;
  searchKeys: string;
  url: string;
}

interface ProjectGroup {
  title: string;
  description: string;
  tone: "ink" | "paper";
  reverse?: boolean;
  projects: readonly Project[];
}

interface SearchEntry {
  title: string;
  detail: string;
  keys: string;
  url: string;
}

const navigationItems = [
  {
    id: "about",
    railLabel: "组织",
    mobileLabel: "了解组织",
    search: {
      title: "了解组织",
      detail: "中国数术数字基础设施",
      keys: "定位 组织 介绍 数术"
    }
  },
  {
    id: "work",
    railLabel: "成果",
    mobileLabel: "浏览成果",
    search: {
      title: "公开成果",
      detail: "浏览五项公开工作",
      keys: "仓库 项目 开源"
    }
  },
  {
    id: "building",
    railLabel: "建设",
    mobileLabel: "持续建设",
    search: {
      title: "持续建设",
      detail: "了解 MathArts 正在推进的工作",
      keys: "建设 开发 规则 工程 进展"
    }
  },
  {
    id: "method",
    railLabel: "治理",
    mobileLabel: "组织治理",
    search: {
      title: "组织治理",
      detail: "公开优先、证据优先、职责明确",
      keys: "公开 证据 权限 职责 治理"
    }
  },
  {
    id: "participate",
    railLabel: "参与",
    mobileLabel: "关注与参与",
    search: {
      title: "贡献方式",
      detail: "参与 MathArts 开放源码协作",
      keys: "贡献 开发 讨论",
      url: "https://github.com/matharts/.github/blob/main/CONTRIBUTING.md"
    }
  }
] as const satisfies readonly NavigationItem[];

const projectGroups: readonly ProjectGroup[] = [
  {
    title: "领域引擎",
    description: "目前包含紫微斗数排盘与天文历法两个标准驱动引擎。",
    tone: "ink",
    projects: [
      {
        title: "ziwei",
        description: "MathArts 开放源码生态的标准驱动紫微斗数排盘引擎",
        searchDetail: "标准驱动紫微斗数排盘引擎",
        searchKeys: "紫微 斗数 排盘",
        url: "https://github.com/matharts/ziwei"
      },
      {
        title: "astro",
        description: "MathArts 开放源码生态的标准驱动天文历法引擎",
        searchDetail: "标准驱动天文历法引擎",
        searchKeys: "天文 历法",
        url: "https://github.com/matharts/astro"
      }
    ]
  },
  {
    title: "生态基础设施",
    description: "为 MathArts 开放源码生态提供基础设施、核心标准库与领域应用。",
    tone: "paper",
    reverse: true,
    projects: [
      {
        title: "core",
        description: "MathArts 开放源码生态的基础设施与核心标准库",
        searchDetail: "生态基础设施与核心标准库",
        searchKeys: "基础设施 核心 标准",
        url: "https://github.com/matharts/core"
      },
      {
        title: "ziwei-atlas",
        description: "面向紫微斗数命理师的专业工作台，用于教学、整理与分析案例",
        searchDetail: "紫微斗数命理师专业工作台",
        searchKeys: "紫微 斗数 工作台 案例",
        url: "https://github.com/matharts/ziwei-atlas"
      }
    ]
  },
  {
    title: "工具与治理",
    description: "维护组织主页、社区文件、贡献入口与跨仓库协作规范。",
    tone: "ink",
    projects: [
      {
        title: ".github",
        description: "MathArts 官方主页，汇集组织介绍、品牌与社区文档",
        searchDetail: "组织治理、社区文件与贡献入口",
        searchKeys: "社区 治理 贡献 自动化",
        url: "https://github.com/matharts/.github"
      }
    ]
  }
] as const;

const pageEntries: readonly SearchEntry[] = navigationItems.map(({ id, search }) => ({
  title: search.title,
  detail: search.detail,
  keys: search.keys,
  url: "url" in search ? search.url : `#${id}`
}));

const projectEntries: readonly SearchEntry[] = projectGroups.flatMap(({ projects }) =>
  projects.map(({ title, searchDetail: detail, searchKeys: keys, url }) => ({
    title,
    detail,
    keys,
    url
  }))
);

const projectCount = projectGroups.reduce((count, { projects }) => count + projects.length, 0);
const navigation = navigationItems.map(({ id, railLabel, mobileLabel }) => ({
  id,
  railLabel,
  mobileLabel
}));
const work = projectGroups.map(({ projects, ...group }) => ({
  ...group,
  projects: projects.map(({ title, description, url }) => ({ title, description, url }))
}));

export const siteContent = {
  navigation,
  work,
  search: {
    entries: [...projectEntries, ...pageEntries] as readonly SearchEntry[],
    statusText: `${projectCount} 个项目 · ${pageEntries.length} 个导航入口`
  }
} as const;
