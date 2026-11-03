import { describe, expect, it } from "vitest"
import { toSearchResults } from "./web-search.server"

describe("toSearchResults", () => {
  it("maps SearXNG results to compact title/url/snippet", () => {
    const results = toSearchResults({
      results: [
        {
          title: " Valeriano ",
          url: "https://es.wikipedia.org/x",
          content: "Emperador",
        },
      ],
    })
    expect(results).toEqual([
      {
        title: "Valeriano",
        url: "https://es.wikipedia.org/x",
        snippet: "Emperador",
      },
    ])
  })

  it("keeps at most five web results and drops non-http URLs", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      title: `t${i}`,
      url: i === 0 ? "javascript:alert(1)" : `https://a.test/${i}`,
    }))
    const results = toSearchResults({ results: many })
    expect(results).toHaveLength(5)
    expect(results[0].url).toBe("https://a.test/1")
  })

  it("truncates long snippets to 200 characters", () => {
    const [result] = toSearchResults({
      results: [
        { title: "t", url: "https://a.test", content: "x".repeat(500) },
      ],
    })
    expect(result.snippet.length).toBeLessThanOrEqual(200)
  })

  it("returns no results for unexpected bodies", () => {
    expect(toSearchResults({ nope: true })).toEqual([])
  })
})
