import type { ImageSourcePropType } from "react-native";

import fishCollectionImage1 from "@/assets/images/fish-collection/fish-collection-id-1.png";
import fishCollectionImage10 from "@/assets/images/fish-collection/fish-collection-id-10.png";
import fishCollectionImage11 from "@/assets/images/fish-collection/fish-collection-id-11.png";
import fishCollectionImage12 from "@/assets/images/fish-collection/fish-collection-id-12.png";
import fishCollectionImage13 from "@/assets/images/fish-collection/fish-collection-id-13.png";
import fishCollectionImage14 from "@/assets/images/fish-collection/fish-collection-id-14.png";
import fishCollectionImage15 from "@/assets/images/fish-collection/fish-collection-id-15.png";
import fishCollectionImage16 from "@/assets/images/fish-collection/fish-collection-id-16.png";
import fishCollectionImage17 from "@/assets/images/fish-collection/fish-collection-id-17.png";
import fishCollectionImage18 from "@/assets/images/fish-collection/fish-collection-id-18.png";
import fishCollectionImage19 from "@/assets/images/fish-collection/fish-collection-id-19.png";
import fishCollectionImage2 from "@/assets/images/fish-collection/fish-collection-id-2.png";
import fishCollectionImage20 from "@/assets/images/fish-collection/fish-collection-id-20.png";
import fishCollectionImage21 from "@/assets/images/fish-collection/fish-collection-id-21.png";
import fishCollectionImage22 from "@/assets/images/fish-collection/fish-collection-id-22.png";
import fishCollectionImage23 from "@/assets/images/fish-collection/fish-collection-id-23.png";
import fishCollectionImage24 from "@/assets/images/fish-collection/fish-collection-id-24.png";
import fishCollectionImage25 from "@/assets/images/fish-collection/fish-collection-id-25.png";
import fishCollectionImage26 from "@/assets/images/fish-collection/fish-collection-id-26.png";
import fishCollectionImage27 from "@/assets/images/fish-collection/fish-collection-id-27.png";
import fishCollectionImage28 from "@/assets/images/fish-collection/fish-collection-id-28.png";
import fishCollectionImage29 from "@/assets/images/fish-collection/fish-collection-id-29.png";
import fishCollectionImage3 from "@/assets/images/fish-collection/fish-collection-id-3.png";
import fishCollectionImage30 from "@/assets/images/fish-collection/fish-collection-id-30.png";
import fishCollectionImage31 from "@/assets/images/fish-collection/fish-collection-id-31.png";
import fishCollectionImage32 from "@/assets/images/fish-collection/fish-collection-id-32.png";
import fishCollectionImage33 from "@/assets/images/fish-collection/fish-collection-id-33.png";
import fishCollectionImage34 from "@/assets/images/fish-collection/fish-collection-id-34.png";
import fishCollectionImage35 from "@/assets/images/fish-collection/fish-collection-id-35.png";
import fishCollectionImage36 from "@/assets/images/fish-collection/fish-collection-id-36.png";
import fishCollectionImage37 from "@/assets/images/fish-collection/fish-collection-id-37.png";
import fishCollectionImage38 from "@/assets/images/fish-collection/fish-collection-id-38.png";
import fishCollectionImage4 from "@/assets/images/fish-collection/fish-collection-id-4.png";
import fishCollectionImage5 from "@/assets/images/fish-collection/fish-collection-id-5.png";
import fishCollectionImage6 from "@/assets/images/fish-collection/fish-collection-id-6.png";
import fishCollectionImage7 from "@/assets/images/fish-collection/fish-collection-id-7.png";
import fishCollectionImage8 from "@/assets/images/fish-collection/fish-collection-id-8.png";
import fishCollectionImage9 from "@/assets/images/fish-collection/fish-collection-id-9.png";

export const fishCollectionImages: Record<number, ImageSourcePropType> = {
  1: fishCollectionImage1,
  2: fishCollectionImage2,
  3: fishCollectionImage3,
  4: fishCollectionImage4,
  5: fishCollectionImage5,
  6: fishCollectionImage6,
  7: fishCollectionImage7,
  8: fishCollectionImage8,
  9: fishCollectionImage9,
  10: fishCollectionImage10,
  11: fishCollectionImage11,
  12: fishCollectionImage12,
  13: fishCollectionImage13,
  14: fishCollectionImage14,
  15: fishCollectionImage15,
  16: fishCollectionImage16,
  17: fishCollectionImage17,
  18: fishCollectionImage18,
  19: fishCollectionImage19,
  20: fishCollectionImage20,
  21: fishCollectionImage21,
  22: fishCollectionImage22,
  23: fishCollectionImage23,
  24: fishCollectionImage24,
  25: fishCollectionImage25,
  26: fishCollectionImage26,
  27: fishCollectionImage27,
  28: fishCollectionImage28,
  29: fishCollectionImage29,
  30: fishCollectionImage30,
  31: fishCollectionImage31,
  32: fishCollectionImage32,
  33: fishCollectionImage33,
  34: fishCollectionImage34,
  35: fishCollectionImage35,
  36: fishCollectionImage36,
  37: fishCollectionImage37,
  38: fishCollectionImage38,
};

export function getFishCollectionImageSource(speciesId: number) {
  return fishCollectionImages[speciesId] ?? fishCollectionImage1;
}
