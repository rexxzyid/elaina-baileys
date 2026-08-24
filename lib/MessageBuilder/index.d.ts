export declare const VERSION: "4.7";
export declare const MESSAGE_BUILDER_VERSION: "4.7";

export interface AIRichItemOptions {
  id?: string;
  replace?: string | number;
  insertAt?: string | number;
}

export declare class AIRichError extends Error {
  constructor(message: string, code: string, meta?: Record<string, any>);
  code: string;
}

export declare class ItemNotFoundError extends AIRichError {
  constructor(id: string, availableIds?: string[]);
  id: string;
  availableIds: string[];
}

export declare class DuplicateIdError extends AIRichError {
  constructor(id: string);
  id: string;
}

export declare class InvalidTargetError extends AIRichError {
  constructor(message: string, meta?: Record<string, any>);
}

export declare class ContentValidationError extends AIRichError {
  constructor(message: string, meta?: Record<string, any>);
}

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
  static stringifyEscaped(obj: any): string;
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
  loadFrom(msg: any): this;
  setVideo(path: any, options?: Record<string, any>): this;
  setImage(path: any, options?: Record<string, any>): this;
  setDocument(path: any, options?: Record<string, any>): this;
  setMedia(obj: Record<string, any>): this;
  clearButtons(): this;
  setParams(obj: Record<string, any>): this;
  addButton(name: string, params: Record<string, any> | string): this;
  makeRow(header?: string, title?: string, description?: string, id?: string): this;
  makeSection(title?: string, highlightLabel?: string): this;
  addSelection(title: string, options?: Record<string, any>): this;
  addReply(displayText?: string, id?: string, options?: Record<string, any>): this;
  addCall(displayText?: string, id?: string, options?: Record<string, any>): this;
  addReminder(displayText?: string, id?: string, options?: Record<string, any>): this;
  addCancelReminder(displayText?: string, id?: string, options?: Record<string, any>): this;
  addAddress(displayText?: string, id?: string, options?: Record<string, any>): this;
  addLocation(options?: Record<string, any>): this;
  addUrl(displayText?: string, url?: string, webviewInteraction?: boolean, options?: Record<string, any>): this;
  addCopy(displayText?: string, copyCode?: string, options?: Record<string, any>): this;
  static paramsList: Record<string, any>;
  toCard(): Promise<any>;
  build(jid: string, options?: Record<string, any>): Promise<any>;
  send(jid: string, options?: Record<string, any>): Promise<any>;
}

export declare class ButtonV2 extends BaseBuilder {
  constructor(client: any);
  loadFrom(msg: any): this;
  addButton(displayText?: string, buttonId?: string): this;
  addRawButton(obj: Record<string, any>): this;
  setRawThumbnail(thumbnail: string): this;
  setThumbnail(path: any): this;
  setMedia(obj: Record<string, any>): this;
  build(jid: string, options?: Record<string, any>): Promise<any>;
  send(jid: string, options?: Record<string, any>): Promise<any>;
}

export declare class Carousel extends BaseBuilder {
  constructor(client: any);
  loadFrom(msg: any): this;
  addCard(card: any): this;
  build(jid: string, options?: Record<string, any>): any;
  send(jid: string, options?: Record<string, any>): Promise<any>;
}

export declare class AIRich extends BaseBuilder {
  constructor(client: any, options?: { dynamic?: boolean; unsupportedTypeAlert?: boolean });
  loadFrom(msg: any): this;
  setResponseId(id: string): this;
  refreshResponseId(): this;
  setBotResponseId(id: string): this;
  refreshBotResponseId(): this;
  createAlert(type: string): any;
  hasId(id: string): boolean;
  getIds(): string[];
  peek(id?: string | number): any;
  assignId(target: string | number, id: string): this;
  delete(target: string | number): this;
  addSubmessage(submessage: any, options?: AIRichItemOptions): this;
  addSection(section: any, options?: AIRichItemOptions): this;
  addText(text: string, options?: AIRichItemOptions & { hyperlink?: boolean; citation?: boolean; latex?: boolean }): this;
  addFOAText(text: string, options?: AIRichItemOptions): this;
  addCode(language: string, code: string, options?: AIRichItemOptions): this;
  addTable(table: string[][], options?: AIRichItemOptions & { hyperlink?: boolean; citation?: boolean; latex?: boolean }): this;
  addSource(sources?: any[], options?: AIRichItemOptions): this;
  addReels(reelsItems?: any, options?: AIRichItemOptions): this;
  addImage(imageUrl: any, options?: AIRichItemOptions & { width?: number; height?: number; status?: string; update_text?: string; resolveUrl?: boolean }): this;
  addVideo(videoUrl: any, options?: AIRichItemOptions & { autoFill?: boolean; status?: string; estimatedTime?: number }): this;
  addProduct(data?: any, options?: AIRichItemOptions): this;
  addPost(data?: any, options?: AIRichItemOptions): this;
  addMetadata(text: string, options?: AIRichItemOptions): this;
  addTip(text: string, options?: AIRichItemOptions): this;
  addWidget(data: any, options?: AIRichItemOptions & { layout?: string }): this;
  addFooterAction(data: any, options?: AIRichItemOptions & { layout?: string }): this;
  addSuggest(suggestion: string | string[], options?: AIRichItemOptions & { scroll?: boolean; layout?: string }): this;
  build(jid: string, options?: Record<string, any>): Promise<any>;
  buildEdit(targetJid: string, targetId: string, options?: Record<string, any>): Promise<any>;
  send(jid: string, options?: Record<string, any>): Promise<any>;
  sendEdit(jid?: string, id?: string, options?: Record<string, any>): Promise<any>;
  readonly sections: any[];
  readonly items: any[];
  static tokenizer(code: string, lang?: string): any;
  static toTableMetadata(arr: string[][], options?: Record<string, any>): any;
  static newLayout(name: string, data: any, extra?: Record<string, any>): any;
  static generateVerificationMetadata(): any;
}

export declare const MessageBuilder: Readonly<{
  VERSION: "4.7";
  Button: typeof Button;
  ButtonV2: typeof ButtonV2;
  Carousel: typeof Carousel;
  AIRich: typeof AIRich;
  Toolkit: typeof Toolkit;
  AIRichError: typeof AIRichError;
  ItemNotFoundError: typeof ItemNotFoundError;
  DuplicateIdError: typeof DuplicateIdError;
  InvalidTargetError: typeof InvalidTargetError;
  ContentValidationError: typeof ContentValidationError;
}>;

export declare const MB: typeof MessageBuilder;
