export interface Kazus {
  kazus: string;
  javob: string;
}

export interface Toplam {
  id: string;
  kod: string;
  ustoz_ismi: string;
  ustoz_id?: string;
  mavzu?: string;
  kazuslar: Kazus[];
  created_at: string;
}

export interface OquvchiJavob {
  kazus_index: number;
  javob: string;
}

export interface XatoQism {
  xato: string;
  togri: string;
  tur: 'imlo' | 'mazmun';
}

export interface BatafilTahlil {
  xatolar: XatoQism[];
  yetishmayotganlar: string[];
}

export interface BahoNatija {
  kazus_index: number;
  ball: number;
  izoh: string;
  batafsil_tahlil: BatafilTahlil;
}

export interface Javob {
  id: string;
  toplam_id: string;
  toplam_kod: string;
  oquvchi_ismi: string;
  javoblar: OquvchiJavob[];
  baho: BahoNatija[];
  created_at: string;
}
