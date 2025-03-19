import afAndroid from '../assets/buttons/android/af.svg';
import arAndroid from '../assets/buttons/android/ar.svg';
import azAndroid from '../assets/buttons/android/az.svg';
import bgAndroid from '../assets/buttons/android/bg.svg';
import bsAndroid from '../assets/buttons/android/bs.svg';
import caAndroid from '../assets/buttons/android/ca.svg';
import csAndroid from '../assets/buttons/android/cs.svg';
import dkAndroid from '../assets/buttons/android/dk.svg';
import deAndroid from '../assets/buttons/android/de.svg';
import elAndroid from '../assets/buttons/android/el.svg';
import enAndroid from '../assets/buttons/android/en.svg';
import esAndroid from '../assets/buttons/android/es.svg';
import etAndroid from '../assets/buttons/android/et.svg';
import fiAndroid from '../assets/buttons/android/fi.svg';
import frAndroid from '../assets/buttons/android/fr.svg';
import heAndroid from '../assets/buttons/android/he.svg';
import hkAndroid from '../assets/buttons/android/hk.svg';
import hrAndroid from '../assets/buttons/android/hr.svg';
import huAndroid from '../assets/buttons/android/hu.svg';
import hyAndroid from '../assets/buttons/android/hy.svg';
import idAndroid from '../assets/buttons/android/id.svg';
import isAndroid from '../assets/buttons/android/is.svg';
import itAndroid from '../assets/buttons/android/it.svg';
import jaAndroid from '../assets/buttons/android/ja.svg';
import kaAndroid from '../assets/buttons/android/ka.svg';
import kkAndroid from '../assets/buttons/android/kk.svg';
import kmAndroid from '../assets/buttons/android/km.svg';
import kyAndroid from '../assets/buttons/android/ky.svg';
import ltAndroid from '../assets/buttons/android/lt.svg';
import lvAndroid from '../assets/buttons/android/lv.svg';
import mkAndroid from '../assets/buttons/android/mk.svg';
import nlAndroid from '../assets/buttons/android/nl.svg';
import noAndroid from '../assets/buttons/android/no.svg';
import plAndroid from '../assets/buttons/android/pl.svg';
import ptAndroid from '../assets/buttons/android/pt.svg';
import roAndroid from '../assets/buttons/android/ro.svg';
import ruAndroid from '../assets/buttons/android/ru.svg';
import skAndroid from '../assets/buttons/android/sk.svg';
import slAndroid from '../assets/buttons/android/sl.svg';
import sqAndroid from '../assets/buttons/android/sq.svg';
import srAndroid from '../assets/buttons/android/sr.svg';
import swAndroid from '../assets/buttons/android/sw.svg';
import thAndroid from '../assets/buttons/android/th.svg';
import trAndroid from '../assets/buttons/android/tr.svg';
import twAndroid from '../assets/buttons/android/tw.svg';
import ukAndroid from '../assets/buttons/android/uk.svg';
import urAndroid from '../assets/buttons/android/ur.svg';
import uzAndroid from '../assets/buttons/android/uz.svg';
import enApple from '../assets/buttons/apple/en.svg';
import esApple from '../assets/buttons/apple/es.svg';
import type {Platform} from './NativeWallet';

// Here you can find the expansion of language abbreviations used in the map
// https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes (Set 1)
const LOCALIZED_BUTTONS: Record<Platform, Record<string, string>> = {
  android: {
    af: afAndroid,
    ar: arAndroid,
    az: azAndroid,
    bg: bgAndroid,
    bs: bsAndroid,
    ca: caAndroid,
    cs: csAndroid,
    dk: dkAndroid,
    de: deAndroid,
    el: elAndroid,
    en: enAndroid,
    es: esAndroid,
    et: etAndroid,
    fi: fiAndroid,
    fr: frAndroid,
    he: heAndroid,
    hk: hkAndroid,
    hr: hrAndroid,
    hu: huAndroid,
    hy: hyAndroid,
    id: idAndroid,
    is: isAndroid,
    it: itAndroid,
    ja: jaAndroid,
    ka: kaAndroid,
    kk: kkAndroid,
    km: kmAndroid,
    ky: kyAndroid,
    lt: ltAndroid,
    lv: lvAndroid,
    mk: mkAndroid,
    nl: nlAndroid,
    no: noAndroid,
    pl: plAndroid,
    pt: ptAndroid,
    ro: roAndroid,
    ru: ruAndroid,
    sk: skAndroid,
    sl: slAndroid,
    sq: sqAndroid,
    sr: srAndroid,
    sw: swAndroid,
    th: thAndroid,
    tr: trAndroid,
    tw: twAndroid,
    uk: ukAndroid,
    ur: urAndroid,
    uz: uzAndroid,
    default: enAndroid,
  },
  ios: {
    // soon
    en: enApple,
    es: esApple,
    default: enApple,
  },
};

export default LOCALIZED_BUTTONS;
