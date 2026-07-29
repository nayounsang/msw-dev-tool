export const getCssPropertiesStyleSheet = (styles: string) => {
  if (typeof CSSStyleSheet === "undefined") {
    return null;
  }

  const shadowSheet = new CSSStyleSheet();
  shadowSheet.replaceSync(styles.replace(/:root/gu, ":host"));
  const properties = [];
  for (const rule of Array.from(shadowSheet.cssRules)) {
    if (typeof CSSPropertyRule !== "undefined" && rule instanceof CSSPropertyRule) {
      if (rule.initialValue) {
        properties.push(`${rule.name}: ${rule.initialValue}`);
      }
    }
  }

  shadowSheet.insertRule(`:host { ${properties.join("; ")} }`);
  return shadowSheet;
};
