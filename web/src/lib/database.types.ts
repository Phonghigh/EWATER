export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      catchments: {
        Row: {
          geom: unknown
          id: number
        }
        Insert: {
          geom: unknown
          id?: never
        }
        Update: {
          geom?: unknown
          id?: never
        }
        Relationships: []
      }
      culverts: {
        Row: {
          gate_series: number[]
          geom: unknown
          id: number
          inside_series: number[]
          name: string
          river_series: number[]
        }
        Insert: {
          gate_series: number[]
          geom: unknown
          id?: never
          inside_series: number[]
          name: string
          river_series: number[]
        }
        Update: {
          gate_series?: number[]
          geom?: unknown
          id?: never
          inside_series?: number[]
          name?: string
          river_series?: number[]
        }
        Relationships: []
      }
      rain_stations: {
        Row: {
          battery_pct: number | null
          code: string
          elevation_m: number | null
          geom: unknown
          id: number
          name: string
          rain_10min: number[]
          signal: string | null
          status: string
        }
        Insert: {
          battery_pct?: number | null
          code: string
          elevation_m?: number | null
          geom: unknown
          id?: never
          name: string
          rain_10min: number[]
          signal?: string | null
          status?: string
        }
        Update: {
          battery_pct?: number | null
          code?: string
          elevation_m?: number | null
          geom?: unknown
          id?: never
          name?: string
          rain_10min?: number[]
          signal?: string | null
          status?: string
        }
        Relationships: []
      }
      drainage_boundary: {
        Row: {
          geom: unknown
          id: number
          name: string | null
        }
        Insert: {
          geom: unknown
          id?: never
          name?: string | null
        }
        Update: {
          geom?: unknown
          id?: never
          name?: string | null
        }
        Relationships: []
      }
      flood_zones: {
        Row: {
          geom: unknown
          node_count: number
          run_id: number | null
          severity: number[]
          zone: number
        }
        Insert: {
          geom: unknown
          node_count: number
          run_id?: number | null
          severity?: number[]
          zone: number
        }
        Update: {
          geom?: unknown
          node_count?: number
          run_id?: number | null
          severity?: number[]
          zone?: number
        }
        Relationships: [
          {
            foreignKeyName: "flood_zones_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      network_links: {
        Row: {
          diameter: number | null
          down_level: number | null
          from_node_muid: string
          geom: unknown
          inlet_offset: number | null
          length: number | null
          manning_n: number | null
          muid: string
          outlet_offset: number | null
          shape: string | null
          slope: number | null
          to_node_muid: string
          up_level: number | null
        }
        Insert: {
          diameter?: number | null
          down_level?: number | null
          from_node_muid: string
          geom: unknown
          inlet_offset?: number | null
          length?: number | null
          manning_n?: number | null
          muid: string
          outlet_offset?: number | null
          shape?: string | null
          slope?: number | null
          to_node_muid: string
          up_level?: number | null
        }
        Update: {
          diameter?: number | null
          down_level?: number | null
          from_node_muid?: string
          geom?: unknown
          inlet_offset?: number | null
          length?: number | null
          manning_n?: number | null
          muid?: string
          outlet_offset?: number | null
          shape?: string | null
          slope?: number | null
          to_node_muid?: string
          up_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "network_links_from_node_muid_fkey"
            columns: ["from_node_muid"]
            isOneToOne: false
            referencedRelation: "network_nodes"
            referencedColumns: ["muid"]
          },
          {
            foreignKeyName: "network_links_from_node_muid_fkey"
            columns: ["from_node_muid"]
            isOneToOne: false
            referencedRelation: "network_nodes_geojson"
            referencedColumns: ["muid"]
          },
          {
            foreignKeyName: "network_links_to_node_muid_fkey"
            columns: ["to_node_muid"]
            isOneToOne: false
            referencedRelation: "network_nodes"
            referencedColumns: ["muid"]
          },
          {
            foreignKeyName: "network_links_to_node_muid_fkey"
            columns: ["to_node_muid"]
            isOneToOne: false
            referencedRelation: "network_nodes_geojson"
            referencedColumns: ["muid"]
          },
        ]
      }
      network_nodes: {
        Row: {
          diameter: number | null
          geom: unknown
          ground_level: number | null
          init_depth: number | null
          invert_level: number | null
          max_depth: number | null
          muid: string
          node_type: Database["public"]["Enums"]["node_type"]
          ponded_area: number | null
          surcharge_depth: number | null
        }
        Insert: {
          diameter?: number | null
          geom: unknown
          ground_level?: number | null
          init_depth?: number | null
          invert_level?: number | null
          max_depth?: number | null
          muid: string
          node_type: Database["public"]["Enums"]["node_type"]
          ponded_area?: number | null
          surcharge_depth?: number | null
        }
        Update: {
          diameter?: number | null
          geom?: unknown
          ground_level?: number | null
          init_depth?: number | null
          invert_level?: number | null
          max_depth?: number | null
          muid?: string
          node_type?: Database["public"]["Enums"]["node_type"]
          ponded_area?: number | null
          surcharge_depth?: number | null
        }
        Relationships: []
      }
      node_id_crosswalk: {
        Row: {
          match_distance_m: number
          mike_muid: string
          swmm_node_name: string
          verified: boolean
        }
        Insert: {
          match_distance_m: number
          mike_muid: string
          swmm_node_name: string
          verified?: boolean
        }
        Update: {
          match_distance_m?: number
          mike_muid?: string
          swmm_node_name?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "node_id_crosswalk_mike_muid_fkey"
            columns: ["mike_muid"]
            isOneToOne: false
            referencedRelation: "network_nodes"
            referencedColumns: ["muid"]
          },
          {
            foreignKeyName: "node_id_crosswalk_mike_muid_fkey"
            columns: ["mike_muid"]
            isOneToOne: false
            referencedRelation: "network_nodes_geojson"
            referencedColumns: ["muid"]
          },
        ]
      }
      profiles: {
        Row: {
          email: string
          full_name: string | null
          home_lat: number | null
          home_lng: number | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          email: string
          full_name?: string | null
          home_lat?: number | null
          home_lng?: number | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          email?: string
          full_name?: string | null
          home_lat?: number | null
          home_lng?: number | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      province_boundaries: {
        Row: {
          code: string
          geom: unknown
          name: string
        }
        Insert: {
          code: string
          geom: unknown
          name: string
        }
        Update: {
          code?: string
          geom?: unknown
          name?: string
        }
        Relationships: []
      }
      rain_forecast_points: {
        Row: {
          forecast_id: number
          precipitation_mm: number
          ts: string
        }
        Insert: {
          forecast_id: number
          precipitation_mm: number
          ts: string
        }
        Update: {
          forecast_id?: number
          precipitation_mm?: number
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "rain_forecast_points_forecast_id_fkey"
            columns: ["forecast_id"]
            isOneToOne: false
            referencedRelation: "rain_forecasts"
            referencedColumns: ["id"]
          },
        ]
      }
      rain_forecasts: {
        Row: {
          generated_at: string
          id: number
          latitude: number
          longitude: number
          source: string
          step_hours: number
        }
        Insert: {
          generated_at: string
          id?: never
          latitude: number
          longitude: number
          source: string
          step_hours: number
        }
        Update: {
          generated_at?: string
          id?: never
          latitude?: number
          longitude?: number
          source?: string
          step_hours?: number
        }
        Relationships: []
      }
      raingages: {
        Row: {
          data_source_name: string
          data_source_type: string
          name: string
          rain_type: string
          snow_catch_factor: number
          time_interval: string
        }
        Insert: {
          data_source_name: string
          data_source_type: string
          name: string
          rain_type: string
          snow_catch_factor: number
          time_interval: string
        }
        Update: {
          data_source_name?: string
          data_source_type?: string
          name?: string
          rain_type?: string
          snow_catch_factor?: number
          time_interval?: string
        }
        Relationships: []
      }
      rivers: {
        Row: {
          geom: unknown
          length: number | null
          river_name: string | null
          topo_id: string
          transect_name: string | null
        }
        Insert: {
          geom: unknown
          length?: number | null
          river_name?: string | null
          topo_id: string
          transect_name?: string | null
        }
        Update: {
          geom?: unknown
          length?: number | null
          river_name?: string | null
          topo_id?: string
          transect_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rivers_transect_name_fkey"
            columns: ["transect_name"]
            isOneToOne: false
            referencedRelation: "transects"
            referencedColumns: ["name"]
          },
        ]
      }
      simulation_node_fill: {
        Row: {
          fill_series: number[]
          node_muid: string
          run_id: number
        }
        Insert: {
          fill_series: number[]
          node_muid: string
          run_id: number
        }
        Update: {
          fill_series?: number[]
          node_muid?: string
          run_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "simulation_node_fill_node_muid_fkey"
            columns: ["node_muid"]
            isOneToOne: false
            referencedRelation: "network_nodes"
            referencedColumns: ["muid"]
          },
          {
            foreignKeyName: "simulation_node_fill_node_muid_fkey"
            columns: ["node_muid"]
            isOneToOne: false
            referencedRelation: "network_nodes_geojson"
            referencedColumns: ["muid"]
          },
          {
            foreignKeyName: "simulation_node_fill_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_runs: {
        Row: {
          created_at: string
          id: number
          rainfall: number[]
          start_time: string
          step_minutes: number
          steps: number
        }
        Insert: {
          created_at?: string
          id?: never
          rainfall: number[]
          start_time: string
          step_minutes: number
          steps: number
        }
        Update: {
          created_at?: string
          id?: never
          rainfall?: number[]
          start_time?: string
          step_minutes?: number
          steps?: number
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      subcatchments: {
        Row: {
          area_ha: number
          curb_length: number
          geom: unknown
          infil_decay: number | null
          infil_dry_time: number | null
          infil_max_infil: number | null
          infil_max_rate: number | null
          infil_min_rate: number | null
          n_imperv: number
          n_perv: number
          name: string
          outlet_node_name: string
          pct_impervious: number
          pct_slope: number
          pct_zero: number
          raingage_name: string
          route_to: string
          s_imperv: number
          s_perv: number
          width_m: number
        }
        Insert: {
          area_ha: number
          curb_length?: number
          geom?: unknown
          infil_decay?: number | null
          infil_dry_time?: number | null
          infil_max_infil?: number | null
          infil_max_rate?: number | null
          infil_min_rate?: number | null
          n_imperv: number
          n_perv: number
          name: string
          outlet_node_name: string
          pct_impervious: number
          pct_slope: number
          pct_zero: number
          raingage_name: string
          route_to: string
          s_imperv: number
          s_perv: number
          width_m: number
        }
        Update: {
          area_ha?: number
          curb_length?: number
          geom?: unknown
          infil_decay?: number | null
          infil_dry_time?: number | null
          infil_max_infil?: number | null
          infil_max_rate?: number | null
          infil_min_rate?: number | null
          n_imperv?: number
          n_perv?: number
          name?: string
          outlet_node_name?: string
          pct_impervious?: number
          pct_slope?: number
          pct_zero?: number
          raingage_name?: string
          route_to?: string
          s_imperv?: number
          s_perv?: number
          width_m?: number
        }
        Relationships: [
          {
            foreignKeyName: "subcatchments_raingage_name_fkey"
            columns: ["raingage_name"]
            isOneToOne: false
            referencedRelation: "raingages"
            referencedColumns: ["name"]
          },
        ]
      }
      swmm_conduits: {
        Row: {
          avg_loss: number | null
          barrels: number
          diameter: number | null
          flap_gate: boolean
          from_node_name: string
          init_flow: number
          inlet_loss: number | null
          inlet_offset: number | null
          length: number
          manning_n: number
          max_flow: number
          name: string
          outlet_loss: number | null
          outlet_offset: number | null
          shape: string
          to_node_name: string
          transect_name: string | null
        }
        Insert: {
          avg_loss?: number | null
          barrels?: number
          diameter?: number | null
          flap_gate?: boolean
          from_node_name: string
          init_flow?: number
          inlet_loss?: number | null
          inlet_offset?: number | null
          length: number
          manning_n: number
          max_flow?: number
          name: string
          outlet_loss?: number | null
          outlet_offset?: number | null
          shape: string
          to_node_name: string
          transect_name?: string | null
        }
        Update: {
          avg_loss?: number | null
          barrels?: number
          diameter?: number | null
          flap_gate?: boolean
          from_node_name?: string
          init_flow?: number
          inlet_loss?: number | null
          inlet_offset?: number | null
          length?: number
          manning_n?: number
          max_flow?: number
          name?: string
          outlet_loss?: number | null
          outlet_offset?: number | null
          shape?: string
          to_node_name?: string
          transect_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "swmm_conduits_transect_name_fkey"
            columns: ["transect_name"]
            isOneToOne: false
            referencedRelation: "transects"
            referencedColumns: ["name"]
          },
        ]
      }
      swmm_outfalls: {
        Row: {
          invert_elev: number
          node_name: string
          outfall_type: string
          stage_source: string | null
          tide_gate: boolean
        }
        Insert: {
          invert_elev: number
          node_name: string
          outfall_type: string
          stage_source?: string | null
          tide_gate?: boolean
        }
        Update: {
          invert_elev?: number
          node_name?: string
          outfall_type?: string
          stage_source?: string | null
          tide_gate?: boolean
        }
        Relationships: []
      }
      tide_levels: {
        Row: {
          level_m: number
          scenario_id: number
          ts: string
        }
        Insert: {
          level_m: number
          scenario_id: number
          ts: string
        }
        Update: {
          level_m?: number
          scenario_id?: number
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "tide_levels_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "tide_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tide_scenarios: {
        Row: {
          amplitude_m: number
          baseline_m: number
          generated_at: string
          id: number
          note: string
          period_hours: number
          seed: number
        }
        Insert: {
          amplitude_m: number
          baseline_m: number
          generated_at: string
          id?: never
          note: string
          period_hours: number
          seed: number
        }
        Update: {
          amplitude_m?: number
          baseline_m?: number
          generated_at?: string
          id?: never
          note?: string
          period_hours?: number
          seed?: number
        }
        Relationships: []
      }
      transects: {
        Row: {
          name: string
          roughness_channel: number
          roughness_left: number
          roughness_right: number
          station_points: Json
        }
        Insert: {
          name: string
          roughness_channel: number
          roughness_left: number
          roughness_right: number
          station_points: Json
        }
        Update: {
          name?: string
          roughness_channel?: number
          roughness_left?: number
          roughness_right?: number
          station_points?: Json
        }
        Relationships: []
      }
    }
    Views: {
      catchments_geojson: {
        Row: {
          geom: Json | null
          id: number | null
        }
        Insert: {
          geom?: never
          id?: number | null
        }
        Update: {
          geom?: never
          id?: number | null
        }
        Relationships: []
      }
      drainage_boundary_geojson: {
        Row: {
          geom: Json | null
          id: number | null
          name: string | null
        }
        Insert: {
          geom?: never
          id?: number | null
          name?: string | null
        }
        Update: {
          geom?: never
          id?: number | null
          name?: string | null
        }
        Relationships: []
      }
      culverts_geojson: {
        Row: {
          gate_series: number[] | null
          geom: Json | null
          id: number | null
          inside_series: number[] | null
          name: string | null
          river_series: number[] | null
        }
        Insert: {
          gate_series?: number[] | null
          geom?: never
          id?: number | null
          inside_series?: number[] | null
          name?: string | null
          river_series?: number[] | null
        }
        Update: {
          gate_series?: number[] | null
          geom?: never
          id?: number | null
          inside_series?: number[] | null
          name?: string | null
          river_series?: number[] | null
        }
        Relationships: []
      }
      rain_stations_geojson: {
        Row: {
          battery_pct: number | null
          code: string | null
          elevation_m: number | null
          geom: Json | null
          id: number | null
          name: string | null
          rain_10min: number[] | null
          signal: string | null
          status: string | null
        }
        Insert: {
          battery_pct?: number | null
          code?: string | null
          elevation_m?: number | null
          geom?: never
          id?: number | null
          name?: string | null
          rain_10min?: number[] | null
          signal?: string | null
          status?: string | null
        }
        Update: {
          battery_pct?: number | null
          code?: string | null
          elevation_m?: number | null
          geom?: never
          id?: number | null
          name?: string | null
          rain_10min?: number[] | null
          signal?: string | null
          status?: string | null
        }
        Relationships: []
      }
      flood_zones_geojson: {
        Row: {
          geom: Json | null
          nodes: number | null
          run_id: number | null
          severity: number[] | null
          zone: number | null
        }
        Insert: {
          geom?: never
          nodes?: number | null
          run_id?: number | null
          severity?: number[] | null
          zone?: number | null
        }
        Update: {
          geom?: never
          nodes?: number | null
          run_id?: number | null
          severity?: number[] | null
          zone?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "flood_zones_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      network_links_geojson: {
        Row: {
          diameter: number | null
          downLevel: number | null
          fromNode: string | null
          geom: Json | null
          inlet_offset: number | null
          length: number | null
          manning_n: number | null
          muid: string | null
          outlet_offset: number | null
          shape: string | null
          slope: number | null
          toNode: string | null
          upLevel: number | null
        }
        Insert: {
          diameter?: number | null
          downLevel?: number | null
          fromNode?: string | null
          geom?: never
          inlet_offset?: number | null
          length?: number | null
          manning_n?: number | null
          muid?: string | null
          outlet_offset?: number | null
          shape?: string | null
          slope?: number | null
          toNode?: string | null
          upLevel?: number | null
        }
        Update: {
          diameter?: number | null
          downLevel?: number | null
          fromNode?: string | null
          geom?: never
          inlet_offset?: number | null
          length?: number | null
          manning_n?: number | null
          muid?: string | null
          outlet_offset?: number | null
          shape?: string | null
          slope?: number | null
          toNode?: string | null
          upLevel?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "network_links_from_node_muid_fkey"
            columns: ["fromNode"]
            isOneToOne: false
            referencedRelation: "network_nodes"
            referencedColumns: ["muid"]
          },
          {
            foreignKeyName: "network_links_from_node_muid_fkey"
            columns: ["fromNode"]
            isOneToOne: false
            referencedRelation: "network_nodes_geojson"
            referencedColumns: ["muid"]
          },
          {
            foreignKeyName: "network_links_to_node_muid_fkey"
            columns: ["toNode"]
            isOneToOne: false
            referencedRelation: "network_nodes"
            referencedColumns: ["muid"]
          },
          {
            foreignKeyName: "network_links_to_node_muid_fkey"
            columns: ["toNode"]
            isOneToOne: false
            referencedRelation: "network_nodes_geojson"
            referencedColumns: ["muid"]
          },
        ]
      }
      network_nodes_geojson: {
        Row: {
          diameter: number | null
          geom: Json | null
          groundLevel: number | null
          init_depth: number | null
          invertLevel: number | null
          max_depth: number | null
          muid: string | null
          node_type: Database["public"]["Enums"]["node_type"] | null
          ponded_area: number | null
          surcharge_depth: number | null
        }
        Insert: {
          diameter?: number | null
          geom?: never
          groundLevel?: number | null
          init_depth?: number | null
          invertLevel?: number | null
          max_depth?: number | null
          muid?: string | null
          node_type?: Database["public"]["Enums"]["node_type"] | null
          ponded_area?: number | null
          surcharge_depth?: number | null
        }
        Update: {
          diameter?: number | null
          geom?: never
          groundLevel?: number | null
          init_depth?: number | null
          invertLevel?: number | null
          max_depth?: number | null
          muid?: string | null
          node_type?: Database["public"]["Enums"]["node_type"] | null
          ponded_area?: number | null
          surcharge_depth?: number | null
        }
        Relationships: []
      }
      province_boundaries_geojson: {
        Row: {
          code: string | null
          geom: Json | null
          name: string | null
        }
        Insert: {
          code?: string | null
          geom?: never
          name?: string | null
        }
        Update: {
          code?: string | null
          geom?: never
          name?: string | null
        }
        Relationships: []
      }
      rivers_geojson: {
        Row: {
          geom: Json | null
          length: number | null
          riverName: string | null
          topoId: string | null
          transect_name: string | null
        }
        Insert: {
          geom?: never
          length?: number | null
          riverName?: string | null
          topoId?: string | null
          transect_name?: string | null
        }
        Update: {
          geom?: never
          length?: number | null
          riverName?: string | null
          topoId?: string | null
          transect_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rivers_transect_name_fkey"
            columns: ["transect_name"]
            isOneToOne: false
            referencedRelation: "transects"
            referencedColumns: ["name"]
          },
        ]
      }
      subcatchments_geojson: {
        Row: {
          area_ha: number | null
          curb_length: number | null
          geom: Json | null
          infil_decay: number | null
          infil_dry_time: number | null
          infil_max_infil: number | null
          infil_max_rate: number | null
          infil_min_rate: number | null
          n_imperv: number | null
          n_perv: number | null
          name: string | null
          outlet_node_name: string | null
          pct_impervious: number | null
          pct_slope: number | null
          pct_zero: number | null
          raingage_name: string | null
          route_to: string | null
          s_imperv: number | null
          s_perv: number | null
          width_m: number | null
        }
        Insert: {
          area_ha?: number | null
          curb_length?: number | null
          geom?: never
          infil_decay?: number | null
          infil_dry_time?: number | null
          infil_max_infil?: number | null
          infil_max_rate?: number | null
          infil_min_rate?: number | null
          n_imperv?: number | null
          n_perv?: number | null
          name?: string | null
          outlet_node_name?: string | null
          pct_impervious?: number | null
          pct_slope?: number | null
          pct_zero?: number | null
          raingage_name?: string | null
          route_to?: string | null
          s_imperv?: number | null
          s_perv?: number | null
          width_m?: number | null
        }
        Update: {
          area_ha?: number | null
          curb_length?: number | null
          geom?: never
          infil_decay?: number | null
          infil_dry_time?: number | null
          infil_max_infil?: number | null
          infil_max_rate?: number | null
          infil_min_rate?: number | null
          n_imperv?: number | null
          n_perv?: number | null
          name?: string | null
          outlet_node_name?: string | null
          pct_impervious?: number | null
          pct_slope?: number | null
          pct_zero?: number | null
          raingage_name?: string | null
          route_to?: string | null
          s_imperv?: number | null
          s_perv?: number | null
          width_m?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subcatchments_raingage_name_fkey"
            columns: ["raingage_name"]
            isOneToOne: false
            referencedRelation: "raingages"
            referencedColumns: ["name"]
          },
        ]
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      gettransactionid: { Args: never; Returns: unknown }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      node_type: "manhole" | "outlet"
      user_role: "citizen" | "authority" | "leadership"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      node_type: ["manhole", "outlet"],
      user_role: ["citizen", "authority", "leadership"],
    },
  },
} as const
