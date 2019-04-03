declare module "spx-katex" {
  interface KatexOptions {
		displayMode?: boolean;
		breakOnUnsupportedCmds?: boolean;
		errorColor?: string;
	}

	class ParseError implements Error {
		constructor(message: string, lexer: any, position: number);
		name: string;
		message: string;
		position: number;
	}

	function render(tex: string, element: HTMLElement, options?:KatexOptions): void;

  function renderToString(tex: string, options?:KatexOptions): string;
  
  function spxPreprocessText(text: string, ignoreNewLines?: boolean): string;

  function spxPreprocessMath(math: string): string;

  function spxRenderMathToString(math: string, options?:KatexOptions): string;
  
  function spxRenderMixedTextToString(text: string, suppressWarnings?: boolean): string;

  function spxRenderMathInElement(elem: HTMLElement, ignoreNewLines?: boolean, suppressWarnings?: boolean): void;
}