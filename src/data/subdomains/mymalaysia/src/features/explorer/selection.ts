/** The Explorer's selection state machine: country → state → district. */
export type ExplorerSelection =
  | { level: "country" }
  | { level: "state"; stateCode: number; stateName: string }
  | {
      level: "district";
      stateCode: number;
      stateName: string;
      districtId: number;
      districtName: string;
    };

export const COUNTRY_SELECTION: ExplorerSelection = { level: "country" };
