"""
Exhaustive list of materials used in superconducting qubit fabrication.

Just names. Properties (T1, T2, bias, etc.) live in a separate file.
This is the master vocabulary — every material the engine might encounter.

Organized by role in the fabrication stack:
  1. Substrates
  2. Superconducting films (base metal / qubit electrode)
  3. Junction materials (Josephson junction)
  4. Capping / passivation layers
  5. Dielectric / spacer materials
  6. 3D cavity materials
  7. Specialty / superinductor materials
"""

from enum import Enum


# ============================================================
# 1. SUBSTRATES
# ============================================================

class Substrate(str, Enum):
    # Sapphire variants
    C_SAPPHIRE = "c_plane_sapphire"
    C_SAPPHIRE_ANNEALED = "c_plane_sapphire_annealed"
    R_SAPPHIRE = "r_plane_sapphire"
    A_SAPPHIRE = "a_plane_sapphire"
    M_SAPPHIRE = "m_plane_sapphire"
    
    # Silicon variants
    SI_CZ = "silicon_czochralski"
    SI_FZ = "silicon_float_zone"
    SI_HIGH_RES = "silicon_high_resistivity"
    SI_28_ENRICHED = "silicon_28_isotopically_enriched"
    SI_H_PASSIVATED = "silicon_hydrogen_passivated"
    SOI = "silicon_on_insulator"
    SI_INTRINSIC = "silicon_intrinsic"
    
    # Other oxide substrates
    QUARTZ = "quartz"
    FUSED_SILICA = "fused_silica"
    MGO = "magnesium_oxide"
    LAALO3 = "lanthanum_aluminate"
    SRTIO3 = "strontium_titanate"
    YSZ = "yttria_stabilized_zirconia"
    
    # Semiconductor substrates
    GAAS = "gallium_arsenide"
    INP = "indium_phosphide"
    INAS = "indium_arsenide"
    SIGE = "silicon_germanium"
    GE = "germanium"
    
    # Other
    DIAMOND_CVD = "diamond_cvd"
    DIAMOND_HPHT = "diamond_hpht"
    ALN = "aluminum_nitride_substrate"
    SIC = "silicon_carbide"
    
    # Composites / engineered
    GLASS_BOROSILICATE = "borosilicate_glass"
    SAPPHIRE_ON_SI = "sapphire_on_silicon"


# ============================================================
# 2. SUPERCONDUCTING FILMS (base metal)
# ============================================================

class SuperconductingFilm(str, Enum):
    # Tantalum variants
    ALPHA_TANTALUM = "alpha_tantalum"
    BETA_TANTALUM = "beta_tantalum"
    TANTALUM_AMORPHOUS = "amorphous_tantalum"
    TANTALUM_NITRIDE = "tantalum_nitride"
    
    # Niobium variants
    NIOBIUM = "niobium"
    NIOBIUM_NITRIDE = "niobium_nitride"
    NIOBIUM_TITANIUM_NITRIDE = "niobium_titanium_nitride"
    NB3SN = "niobium_tin"
    NB3GE = "niobium_germanium"
    NBTI = "niobium_titanium"
    NBN_REACTIVE = "niobium_nitride_reactive_sputtered"
    
    # Aluminum variants
    ALUMINUM = "aluminum"
    ALUMINUM_HIGH_PURITY = "aluminum_high_purity_6N"
    GRANULAR_ALUMINUM = "granular_aluminum"
    ALUMINUM_OXIDE_DOPED = "aluminum_oxide_doped"
    
    # Titanium / Vanadium nitride family
    TITANIUM_NITRIDE = "titanium_nitride"
    VANADIUM = "vanadium"
    VANADIUM_NITRIDE = "vanadium_nitride"
    
    # Rhenium / refractory
    RHENIUM = "rhenium"
    MOLYBDENUM = "molybdenum"
    MOLYBDENUM_RHENIUM = "molybdenum_rhenium"
    TUNGSTEN = "tungsten"
    HAFNIUM = "hafnium"
    
    # Indium / soft superconductors
    INDIUM = "indium"
    TIN = "tin"
    LEAD = "lead"
    
    # Mercury (historical)
    MERCURY = "mercury"
    
    # High-Tc / exotic
    MGB2 = "magnesium_diboride"
    YBCO = "yttrium_barium_copper_oxide"
    BSCCO = "bismuth_strontium_calcium_copper_oxide"
    FE_SE = "iron_selenide"
    
    # Disordered / kinetic inductance films
    NBN_DISORDERED = "disordered_niobium_nitride"
    TIN_DISORDERED = "disordered_titanium_nitride"
    INOX_DISORDERED = "indium_oxide_disordered"
    SNTE = "tin_telluride"
    
    # Topological-adjacent
    ALUMINUM_ON_INAS = "aluminum_on_inas_2deg"
    EPITAXIAL_AL_INAS = "epitaxial_aluminum_inas"


# ============================================================
# 3. JOSEPHSON JUNCTION MATERIALS
# ============================================================

class JunctionMaterial(str, Enum):
    # Standard aluminum oxide tunnel junctions
    AL_ALOX_AL = "aluminum_aluminum_oxide_aluminum"
    AL_ALOX_AL_DOUBLE_OXIDE = "aluminum_double_oxide"
    
    # Junction geometries (same chemistry, different fabrication)
    AL_ALOX_AL_DOLAN = "al_alox_al_dolan_bridge"
    AL_ALOX_AL_MANHATTAN = "al_alox_al_manhattan"
    AL_ALOX_AL_BANDAGE = "al_alox_al_bandage"
    AL_ALOX_AL_MERGED_ELEMENT = "al_alox_al_merged_element"
    AL_ALOX_AL_OVERLAP = "al_alox_al_overlap"
    AL_ALOX_AL_SHADOW_EVAP = "al_alox_al_shadow_evaporated"
    
    # Niobium-based junctions
    NB_ALOX_NB = "niobium_aluminum_oxide_niobium"
    NB_AL_ALOX_AL_NB = "niobium_aluminum_oxide_trilayer"
    NBN_ALN_NBN = "niobium_nitride_aluminum_nitride_trilayer"
    NB_NBOX_NB = "niobium_niobium_oxide_niobium"
    
    # Other tunnel barrier chemistries
    AL_HFOX_AL = "aluminum_hafnium_oxide_aluminum"
    AL_TIOX_AL = "aluminum_titanium_oxide_aluminum"
    AL_MGOX_AL = "aluminum_magnesium_oxide_aluminum"
    AL_AMORPHOUS_SI_AL = "aluminum_amorphous_silicon_aluminum"
    
    # Hybrid superconductor-semiconductor (gatemon family)
    INAS_AL_NANOWIRE = "inas_al_nanowire_junction"
    INAS_AL_2DEG = "inas_al_2deg_junction"
    INSB_AL_NANOWIRE = "insb_al_nanowire_junction"
    GE_AL_NANOWIRE = "germanium_al_nanowire"
    SI_AL_NANOWIRE = "silicon_al_nanowire"
    
    # SNS (superconductor-normal-superconductor)
    AL_CU_AL_SNS = "aluminum_copper_aluminum_sns"
    AL_AG_AL_SNS = "aluminum_silver_aluminum_sns"
    AL_AU_AL_SNS = "aluminum_gold_aluminum_sns"
    NB_AU_NB_SNS = "niobium_gold_niobium_sns"
    
    # Graphene / 2D material junctions
    AL_GRAPHENE_AL = "aluminum_graphene_aluminum"
    NBSE2_GRAPHENE_NBSE2 = "nbse2_graphene_nbse2"
    
    # Topological junctions
    INAS_AL_MAJORANA = "inas_al_majorana_junction"
    HGTE_AL = "hgte_al_topological_junction"
    
    # Other / exotic
    PB_PBOX_PB = "lead_lead_oxide_lead"
    
    # Junction-less / kinetic inductance (technically not Josephson)
    GRAL_BRIDGE = "granular_aluminum_bridge"
    NBN_BRIDGE = "niobium_nitride_kinetic_bridge"


# ============================================================
# 4. CAPPING / PASSIVATION LAYERS
# ============================================================

class CappingMaterial(str, Enum):
    NONE = "no_capping"
    
    # Metallic caps
    TANTALUM_CAP = "tantalum_cap"
    NIOBIUM_CAP = "niobium_cap"
    TITANIUM_CAP = "titanium_cap"
    GOLD_CAP = "gold_cap"
    PLATINUM_CAP = "platinum_cap"
    ALUMINUM_CAP = "aluminum_cap"
    PALLADIUM_CAP = "palladium_cap"
    
    # Oxide caps
    ALOX_CAP = "aluminum_oxide_cap"
    HFOX_CAP = "hafnium_oxide_cap"
    SIOX_CAP = "silicon_oxide_cap"
    AL2O3_ALD_CAP = "ald_alumina_cap"
    
    # Nitride caps
    SIN_CAP = "silicon_nitride_cap"
    ALN_CAP = "aluminum_nitride_cap"
    TIN_CAP = "titanium_nitride_cap"
    
    # Encapsulation
    VACUUM_ENCAPSULATED = "vacuum_encapsulated"
    PARYLENE = "parylene_encapsulation"
    HEXAGONAL_BN = "hexagonal_boron_nitride"
    
    # Hydrogen / passivation
    HYDROGEN_TERMINATION = "hydrogen_terminated_surface"
    FLUORINE_TERMINATION = "fluorine_terminated_surface"


# ============================================================
# 5. DIELECTRIC / SPACER / RESONATOR MATERIALS
# ============================================================

class DielectricMaterial(str, Enum):
    # Vacuum/air (the best dielectric — used in 3D and air-bridge designs)
    VACUUM = "vacuum"
    
    # Native oxides
    NATIVE_AL_OXIDE = "native_aluminum_oxide"
    NATIVE_NB_OXIDE = "native_niobium_oxide"
    NATIVE_TA_OXIDE = "native_tantalum_oxide"
    NATIVE_SI_OXIDE = "native_silicon_oxide"
    
    # Deposited dielectrics
    SIO2_PECVD = "silicon_dioxide_pecvd"
    SIO2_THERMAL = "silicon_dioxide_thermal"
    SIN_PECVD = "silicon_nitride_pecvd"
    SIN_LPCVD = "silicon_nitride_lpcvd"
    AL2O3_ALD = "aluminum_oxide_ald"
    HFO2_ALD = "hafnium_oxide_ald"
    
    # Crystalline dielectrics
    SAPPHIRE_DIELECTRIC = "sapphire_dielectric"
    QUARTZ_DIELECTRIC = "quartz_dielectric"
    SILICON_DIELECTRIC = "silicon_dielectric"
    DIAMOND_DIELECTRIC = "diamond_dielectric"
    
    # Polymer dielectrics (for some bonding / flip-chip)
    BCB = "benzocyclobutene"
    SU8 = "su8_photoresist"
    POLYIMIDE = "polyimide"


# ============================================================
# 6. 3D CAVITY MATERIALS
# ============================================================

class CavityMaterial(str, Enum):
    # Bulk aluminum cavities
    ALUMINUM_5N = "aluminum_5N_purity"
    ALUMINUM_6N = "aluminum_6N_purity"
    ALUMINUM_HIPS = "high_purity_machined_aluminum"
    
    # Niobium cavities
    NIOBIUM_BULK = "bulk_niobium_cavity"
    NIOBIUM_HPS = "high_purity_niobium_cavity"
    NIOBIUM_ELECTROPOLISHED = "electropolished_niobium"
    NIOBIUM_BCP = "buffer_chemical_polished_niobium"
    
    # Compound cavities
    NB3SN_CAVITY = "niobium_tin_coated_cavity"
    
    # Coaxial designs
    COAXIAL_POST_AL = "coaxial_post_aluminum"
    COAXIAL_POST_NB = "coaxial_post_niobium"
    
    # Stripline cavities
    STRIPLINE_AL = "stripline_aluminum"
    STRIPLINE_TA = "stripline_tantalum"
    
    # Photonic crystal
    PHOTONIC_CRYSTAL_SI = "photonic_crystal_silicon"


# ============================================================
# 7. SUPERINDUCTOR / KINETIC INDUCTANCE MATERIALS
# ============================================================

class SuperinductorMaterial(str, Enum):
    # Disordered superconductors
    GRANULAR_ALUMINUM_HIGH_R = "granular_aluminum_high_resistivity"
    GRANULAR_ALUMINUM_LOW_R = "granular_aluminum_low_resistivity"
    NBN_HIGH_KI = "high_kinetic_inductance_nbn"
    TIN_HIGH_KI = "high_kinetic_inductance_tin"
    NBTIN_HIGH_KI = "high_kinetic_inductance_nbtin"
    INOX_HIGH_KI = "high_kinetic_inductance_indium_oxide"
    
    # Josephson junction arrays
    JJ_ARRAY_AL = "josephson_junction_array_aluminum"
    JJ_ARRAY_NB = "josephson_junction_array_niobium"
    
    # Nanowire inductors
    NBTIN_NANOWIRE = "nbtin_nanowire_inductor"
    NBN_NANOWIRE = "nbn_nanowire_inductor"
    
    # Geometric (not "super" but used the same way)
    NIOBIUM_SPIRAL = "niobium_geometric_spiral"
    ALUMINUM_SPIRAL = "aluminum_geometric_spiral"


# ============================================================
# 8. CONTROL / WIRING MATERIALS (the parts above the qubit)
# ============================================================

class WiringMaterial(str, Enum):
    # Bond wires
    GOLD_BOND_WIRE = "gold_bond_wire"
    ALUMINUM_BOND_WIRE = "aluminum_bond_wire"
    
    # Bump bonds (flip-chip)
    INDIUM_BUMP = "indium_bump_bond"
    GOLD_BUMP = "gold_bump_bond"
    COPPER_PILLAR = "copper_pillar_bump"
    
    # Through-silicon vias
    TSV_COPPER = "tsv_copper"
    TSV_TUNGSTEN = "tsv_tungsten"
    TSV_SUPERCONDUCTING = "tsv_superconducting"


# ============================================================
# MASTER LISTS — for downstream iteration
# ============================================================

ALL_SUBSTRATES = list(Substrate)
ALL_FILMS = list(SuperconductingFilm)
ALL_JUNCTIONS = list(JunctionMaterial)
ALL_CAPPINGS = list(CappingMaterial)
ALL_DIELECTRICS = list(DielectricMaterial)
ALL_CAVITIES = list(CavityMaterial)
ALL_SUPERINDUCTORS = list(SuperinductorMaterial)
ALL_WIRING = list(WiringMaterial)


# ============================================================
# COUNTS
# ============================================================

if __name__ == "__main__":
    print(f"Substrates:        {len(ALL_SUBSTRATES)}")
    print(f"SC Films:          {len(ALL_FILMS)}")
    print(f"Junctions:         {len(ALL_JUNCTIONS)}")
    print(f"Cappings:          {len(ALL_CAPPINGS)}")
    print(f"Dielectrics:       {len(ALL_DIELECTRICS)}")
    print(f"Cavity materials:  {len(ALL_CAVITIES)}")
    print(f"Superinductors:    {len(ALL_SUPERINDUCTORS)}")
    print(f"Wiring materials:  {len(ALL_WIRING)}")
    
    total = (len(ALL_SUBSTRATES) + len(ALL_FILMS) + len(ALL_JUNCTIONS) +
             len(ALL_CAPPINGS) + len(ALL_DIELECTRICS) + len(ALL_CAVITIES) +
             len(ALL_SUPERINDUCTORS) + len(ALL_WIRING))
    print(f"\nTotal distinct materials: {total}")
    
    combos = (len(ALL_SUBSTRATES) * len(ALL_FILMS) * len(ALL_JUNCTIONS) *
              len(ALL_CAPPINGS))
    print(f"Combinations (substrate × film × junction × cap): {combos:,}")
