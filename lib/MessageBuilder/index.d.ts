export declare const MESSAGE_BUILDER_VERSION: "4.6";

export declare class Toolkit {
  constructor();
  static extractIE(text: string, options?: Record<string, any>): any;
  static resize(buffer: Buffer, x: number, y: number, fit?: string): Promise<Buffer>;
  static waitAllPromises(input: any): Promise<any>;
  static fetchBuffer(url: string, options?: Record<string, any>, settings?: { silent?: boolean }): Promise<Buffer>;
  static toUrl(client: any, path: any, mediaType?: string): Promise<any>;
  static resolveMedia(client: any, media: any, mediaType?: string, options?: Record<string, any>): Promise<any>;
  static getMp4Duration(buffer: Buffer, options?: { silent?: boolean }): number;
  static getMp4Preview(videoBuffer: Buffer, options?: Record<string, any>): Promise<Buffer | string>;
}

declare class BaseBuilder {
  setTitle(title: string): this;
  setSubtitle(subtitle: string): this;
  setBody(body: string): this;
  setFooter(footer: string): this;
  setContextInfo(obj: Record<string, any>): this;
  addPayload(obj: Record<string, any>): this;
}

export declare class Button extends BaseBuilder {
  constructor(client: any);
  setVideo(path: any, options?: Record<string, any>): this;
  setImage(path: any, options?: Record<string, any>): this;
  setDocument(path: any, options?: Record<string, any>): this;
  setMedia(obj: Record<string, any>): this;
  clearButtons(): this;
  setParams(obj: Record<string, any>): this;
  addButton(name: string, params: Record<string, any>): this;
  makeRow(header?: string, title?: string, description?: string, id?: string): any;
  makeSection(title?: string, highlightLabel?: string): any;
  addSelection(title: string, options?: Record<string, any>): this;
  addReply(displayText?: string, id?: string, options?: Record<string, any>): this;
  addCall(displayText?: string, id?: string, options?: Record<string, any>): this;
  addReminder(displayText?: string, id?: string, options?: Record<string, any>): this;
  addCancelReminder(displayText?: string, id?: string, options?: Record<string, any>): this;
  addAddress(displayText?: string, id?: string, options?: Record<string, any>): this;
  addLocation(options?: Record<string, any>): this;
  addUrl(displayText?: string, url?: string, webviewInteraction?: boolean, options?: Record<string, any>): this;
  addCopy(displayText?: string, copyCode?: string, options?: Record<string, any>): this;
  toCard(): Promise<any>;
  build(jid: string, options?: Record<string, any>): Promise<any>;
  send(jid: string, options?: Record<string, any>): Promise<any>;
}

export declare class ButtonV2 extends BaseBuilder {
  constructor(client: any);
  addButton(displayText?: string, buttonId?: string): this;
  addRawButton(obj: Record<string, any>): this;
  setThumbnail(path: any): this;
  setMedia(obj: Record<string, any>): this;
  build(jid: string, options?: Record<string, any>): Promise<any>;
  send(jid: string, options?: Record<string, any>): Promise<any>;
}

export declare class Carousel extends BaseBuilder {
  constructor(client: any);
  addCard(card: any): this;
  build(jid: string, options?: Record<string, any>): any;
  send(jid: string, options?: Record<string, any>): Promise<any>;
}

export declare class AIRich extends BaseBuilder {
  constructor(client: any);
  addSubmessage(submessage: any): this;
  addSection(section: any): this;
  addText(text: string, options?: Record<string, any>): this;
  addCode(language: string, code: string): this;
  addTable(table: string[][], options?: Record<string, any>): this;
  addSource(sources?: any[]): this;
  addReels(reelsItems?: any[]): this;
  addImage(imageUrl: any, options?: Record<string, any>): this;
  addVideo(videoUrl: any, options?: Record<string, any>): this;
  addProduct(data?: Record<string, any>): this;
  addPost(data?: Record<string, any>): this;
  addTip(text: string): this;
  addSuggest(suggestion: any, options?: Record<string, any>): this;
  build(options?: Record<string, any>): Promise<any>;
  send(jid: string, options?: Record<string, any>): Promise<any>;
  static tokenizer(code: string, lang?: string): any;
  static toTableMetadata(arr: string[][], options?: Record<string, any>): any;
  static newLayout(name: string, data: any, extra?: Record<string, any>): any;
}

export declare const MessageBuilder: Readonly<{
  VERSION: "4.6";
  Button: typeof Button;
  ButtonV2: typeof ButtonV2;
  Carousel: typeof Carousel;
  AIRich: typeof AIRich;
  Toolkit: typeof Toolkit;
}>;

export declare const MB: typeof MessageBuilder;
