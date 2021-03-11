// eslint-disable-next-line
import React from 'react';
import DataSheetBase from './DataSheetBase.js';

export default class DataSheet_localizationSheet extends DataSheetBase {

  constructor(id, updateCb) {
    super(id, updateCb);
    this.requestedKeyPath = "";  // this value can be specified in the React Studio data sheet UI
  }

  makeDefaultItems() {
    // eslint-disable-next-line no-unused-vars
    let key = 1;
    // eslint-disable-next-line no-unused-vars
    let item;
    
    item = {};
    this.items.push(item);
    item['key'] = "start_text_281915";
    item['en'] = "Welcome to Team Frontseat";
    
    item = {};
    this.items.push(item);
    item['key'] = "start_button_380495";
    item['en'] = "ENTER";
    
    item = {};
    this.items.push(item);
    item['key'] = "comp1_button_573226";
    item['en'] = "ENTER";
    
    item = {};
    this.items.push(item);
    item['key'] = "start_button_947759";
    item['en'] = "ENTER";
    
    item = {};
    this.items.push(item);
    item['key'] = "start_button2_619751";
    item['en'] = "GUIDE";
    
    item = {};
    this.items.push(item);
    item['key'] = "user_iconbutton_470641";
    item['en'] = "Icon button";
    
    item = {};
    this.items.push(item);
    item['key'] = "user_button_82336";
    item['en'] = "ADMIN LOGIN";
    
    let storedItems = localStorage.getItem(this.id);
    if (storedItems != null) {
      this.items = JSON.parse(storedItems);
    }
  }

  addItem(item, options) {
    super.addItem(item, options);
    
    localStorage.setItem(this.id, JSON.stringify(this.items));
  }

  removeItem(item, options) {
    super.removeItem(item, options);
    
    localStorage.setItem(this.id, JSON.stringify(this.items));
  }

  replaceItemByRowIndex(idx, newItem, options) {
    super.replaceItemByRowIndex(idx, newItem, options);
    
    localStorage.setItem(this.id, JSON.stringify(this.items));
  }

  getStringsByLanguage = () => {
    let stringsByLang = {};
    for (let row of this.items) {
      const locKey = row.key;
      for (let key in row) {
        if (key === 'key')
          continue;
        let langObj = stringsByLang[key] || {};
        langObj[locKey] = row[key];
        stringsByLang[key] = langObj;
      }
    }
    return stringsByLang;
  }

}
