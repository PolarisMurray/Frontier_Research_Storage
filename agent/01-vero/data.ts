/** Vero, Appendix C, Table 4: specifications passed per instance. Column order matches CONFIGS. */
export interface Instance {
  name: string;
  track: 1 | 2;
  total: number;
  passed: number[];
}

export const CONFIGS = [
  { agent: "GPT-5.5 xhigh", mode: "cp" },
  { agent: "GPT-5.5 xhigh", mode: "po" },
  { agent: "GPT-5.5 medium", mode: "cp" },
  { agent: "GPT-5.5 medium", mode: "po" },
  { agent: "Claude Opus 4.8", mode: "cp" },
  { agent: "Claude Opus 4.8", mode: "po" },
  { agent: "Claude Sonnet 5", mode: "cp" },
  { agent: "Claude Sonnet 5", mode: "po" },
] as const;

export const INSTANCES: Instance[] = [
  { name: "arithmetic", track: 1, total: 191, passed: [191, 189, 139, 191, 191, 191, 128, 117] },
  { name: "dedekind_reals", track: 1, total: 82, passed: [0, 0, 0, 0, 0, 0, 0, 0] },
  { name: "deposit_sc", track: 1, total: 79, passed: [79, 79, 63, 65, 71, 74, 21, 48] },
  { name: "flocq", track: 1, total: 203, passed: [155, 154, 138, 150, 153, 166, 119, 148] },
  { name: "huffman", track: 1, total: 127, passed: [127, 92, 14, 19, 0, 116, 42, 72] },
  { name: "json", track: 1, total: 64, passed: [64, 61, 61, 64, 42, 64, 50, 35] },
  { name: "piggybank", track: 1, total: 23, passed: [17, 17, 17, 17, 17, 17, 17, 17] },
  { name: "sequences", track: 1, total: 84, passed: [84, 84, 84, 25, 21, 71, 0, 65] },
  { name: "unicode", track: 1, total: 46, passed: [0, 36, 0, 32, 0, 40, 0, 26] },
  { name: "verdict", track: 1, total: 119, passed: [108, 97, 109, 0, 112, 52, 91, 0] },
  { name: "verified_bitmasks", track: 1, total: 124, passed: [124, 124, 105, 105, 103, 124, 71, 69] },
  { name: "verified_ironkv", track: 1, total: 22, passed: [19, 22, 17, 14, 19, 19, 11, 14] },
  { name: "vest", track: 1, total: 42, passed: [42, 42, 40, 42, 42, 42, 33, 38] },
  { name: "base58", track: 2, total: 53, passed: [25, 20, 19, 19, 0, 35, 6, 11] },
  { name: "cachetools", track: 2, total: 74, passed: [73, 74, 54, 45, 35, 68, 35, 0] },
  { name: "croniter", track: 2, total: 55, passed: [55, 55, 49, 52, 54, 53, 45, 46] },
  { name: "difflib", track: 2, total: 49, passed: [49, 49, 29, 42, 33, 26, 24, 0] },
  { name: "dijkstar", track: 2, total: 43, passed: [43, 35, 32, 11, 0, 29, 11, 11] },
  { name: "ecdsa", track: 2, total: 48, passed: [48, 48, 43, 37, 46, 48, 39, 31] },
  { name: "galoistools", track: 2, total: 48, passed: [30, 14, 16, 14, 17, 20, 15, 20] },
  { name: "greenery", track: 2, total: 26, passed: [5, 2, 5, 2, 5, 2, 5, 2] },
  { name: "intervaltree", track: 2, total: 56, passed: [56, 55, 34, 16, 0, 8, 8, 13] },
  { name: "ipaddress", track: 2, total: 68, passed: [68, 68, 49, 68, 44, 48, 21, 42] },
  { name: "jsonpatch", track: 2, total: 27, passed: [27, 27, 24, 27, 27, 27, 23, 27] },
  { name: "linked_list", track: 2, total: 109, passed: [109, 109, 108, 87, 109, 109, 109, 81] },
  { name: "munkres", track: 2, total: 19, passed: [19, 12, 19, 12, 19, 12, 7, 12] },
  { name: "netaddr", track: 2, total: 40, passed: [40, 40, 23, 23, 24, 24, 14, 18] },
  { name: "networkx", track: 2, total: 40, passed: [40, 40, 24, 24, 39, 22, 20, 20] },
  { name: "ntheory", track: 2, total: 62, passed: [43, 48, 34, 36, 0, 42, 30, 29] },
  { name: "packaging_version", track: 2, total: 74, passed: [70, 74, 69, 31, 22, 51, 26, 0] },
  { name: "portion", track: 2, total: 63, passed: [63, 63, 13, 29, 0, 0, 20, 9] },
  { name: "primefac", track: 2, total: 56, passed: [56, 56, 20, 51, 43, 47, 16, 18] },
  { name: "primepy", track: 2, total: 9, passed: [9, 9, 8, 6, 9, 9, 8, 7] },
  { name: "prolepticgregorian", track: 2, total: 61, passed: [61, 52, 58, 0, 32, 38, 15, 18] },
  { name: "pyradix", track: 2, total: 52, passed: [52, 52, 50, 52, 35, 1, 45, 31] },
  { name: "pythonconstraint", track: 2, total: 20, passed: [20, 20, 18, 18, 20, 20, 20, 20] },
  { name: "reedsolo", track: 2, total: 48, passed: [0, 27, 12, 9, 14, 19, 7, 9] },
  { name: "rsa", track: 2, total: 63, passed: [59, 63, 30, 33, 49, 33, 35, 29] },
  { name: "semver", track: 2, total: 53, passed: [52, 53, 52, 52, 48, 53, 35, 22] },
  { name: "sortedcontainers", track: 2, total: 49, passed: [49, 24, 15, 18, 33, 40, 14, 11] },
  { name: "textdistance", track: 2, total: 59, passed: [59, 59, 20, 47, 17, 58, 0, 25] },
  { name: "textwrap", track: 2, total: 60, passed: [60, 60, 39, 39, 50, 42, 29, 20] },
  { name: "toposort", track: 2, total: 15, passed: [12, 15, 6, 5, 15, 10, 5, 6] },
];
