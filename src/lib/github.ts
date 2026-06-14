export const GITHUB_WIDGET_STORAGE_KEY = "accusense-widget-config:github";
export const GITHUB_WIDGET_EVENT = "accusense-github-config-updated";

export type GitHubConfig = {
  token: string;
  owner: string;
  repositories: string;
};

export function readGitHubConfig(): GitHubConfig {
  if (typeof window === "undefined") return { token: "", owner: "", repositories: "" };
  try {
    const value = JSON.parse(localStorage.getItem(GITHUB_WIDGET_STORAGE_KEY) ?? "{}") as Partial<GitHubConfig>;
    return {
      token: typeof value.token === "string" ? value.token : "",
      owner: typeof value.owner === "string" ? value.owner : "",
      repositories: typeof value.repositories === "string" ? value.repositories : "",
    };
  } catch {
    return { token: "", owner: "", repositories: "" };
  }
}

export function saveGitHubConfig(config: GitHubConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GITHUB_WIDGET_STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event(GITHUB_WIDGET_EVENT));
}

export async function githubFetch(path: string, token: string) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Token do GitHub inválido ou expirado.");
    if (response.status === 403) throw new Error("O token não tem permissão para consultar estes repositórios.");
    if (response.status === 404) throw new Error("Repositório não encontrado ou sem acesso.");
    throw new Error("Não foi possível consultar o GitHub.");
  }
  return response;
}