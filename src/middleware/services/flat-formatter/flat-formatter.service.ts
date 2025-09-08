// Interface for computed fields directly in FlatFormatter
export interface ComputedFieldOptions {
  [key: string]: (item: any, index: number, allItems: any[]) => any;
}

/**
 * FlatFormatter - Advanced utility class with computed fields support and array slicing
 * Converts complex JSON objects into flat, readable text formats optimized for LLM consumption
 */
export class FlatFormatter {
  
  /**
   * Converts a JSON object to a flat format with optional computed fields
   */
  static flatten(
    data: any,
    options: {
      format: 'sections' | 'numbered' | 'table' | 'separator',
      itemPrefix?: string,
      itemSuffix?: string,
      indentLevel?: number,
      includeArrayIndices?: boolean,
      separator?: string,
      keyValueSeparator?: string,
      ignoreEmptyValues?: boolean,
      ignoredKeys?: string[],
      customFormatters?: Record<string, (value: any) => string>,
      entryTitleKey?: string,
      entryTitleAsPrefix?: boolean,
      entryTitleDefault?: string,
      // Computed fields with offset support
      computedFields?: ComputedFieldOptions,
      computedFieldsFirst?: boolean,  // Whether computed fields should be displayed first
      indexOffset?: number,           // Offset for index-based calculations (default: 0)
      // Array slice options
      arraySliceStart?: number,       // Start position for array slice (inclusive)
      arraySliceEnd?: number,         // End position for array slice (exclusive)
    }
  ): string {
    const {
      format = 'sections',
      itemPrefix = '### ITEM',
      itemSuffix = '###',
      indentLevel = 2,
      includeArrayIndices = true,
      separator = '===',
      keyValueSeparator = ': ',
      ignoreEmptyValues = true,
      ignoredKeys = [],
      customFormatters = {},
      entryTitleKey,
      entryTitleAsPrefix = false,
      entryTitleDefault = 'ENTRY',
      computedFields = {},
      computedFieldsFirst = true,
      indexOffset = 0,
      arraySliceStart,
      arraySliceEnd
    } = options;

    // Function to format a single object
    const formatObject = (obj: any, prefix: string = ''): string => {
      let result = '';
      
      for (const [key, value] of Object.entries(obj)) {
        // Skip keys from the ignoredKeys list
        if (ignoredKeys.includes(key)) continue;
        
        // Skip empty values if desired
        if (ignoreEmptyValues && (value === '' || value === null || value === undefined || 
            (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'object' && Object.keys(value).length === 0))) {
          continue;
        }

        // Use custom formatters if available
        if (customFormatters[key]) {
          result += `${prefix}${key}${keyValueSeparator}${customFormatters[key](value)}\n`;
          continue;
        }

        if (Array.isArray(value)) {
          if (value.every(item => typeof item !== 'object')) {
            // Simple array of primitives
            result += `${prefix}${key}${keyValueSeparator}${value.join(', ')}\n`;
          } else {
            // Array of objects
            result += `${prefix}${key}${keyValueSeparator}\n`;
            value.forEach((item, index) => {
              if (typeof item === 'object' && item !== null) {
                result += includeArrayIndices ? 
                  `${prefix}${' '.repeat(indentLevel)}[${index + indexOffset}] ` : 
                  `${prefix}${' '.repeat(indentLevel)}`;
                result += formatObject(item, `${prefix}${' '.repeat(indentLevel * 2)}`);
                if (index < value.length - 1) result += '\n';
              } else {
                result += `${prefix}${' '.repeat(indentLevel)}${includeArrayIndices ? `[${index + indexOffset}] ` : ''}${item}\n`;
              }
            });
          }
        } else if (typeof value === 'object' && value !== null) {
          // Nested object
          result += `${prefix}${key}${keyValueSeparator}\n`;
          result += formatObject(value, `${prefix}${' '.repeat(indentLevel)}`);
        } else {
          // Primitive value
          result += `${prefix}${key}${keyValueSeparator}${value}\n`;
        }
      }
      
      return result;
    };

    // Main logic for formatting based on desired format
    if (Array.isArray(data)) {
      // Array slice logic
      const originalArray = data;
      let dataToProcess = data;
      let actualStartIndex = 0;

      // Calculate slice parameters
      if (arraySliceStart !== undefined || arraySliceEnd !== undefined) {
        const start = arraySliceStart ?? 0;
        const end = arraySliceEnd ?? data.length;
        dataToProcess = data.slice(start, end);
        actualStartIndex = start;
      }

      // Preprocessing for computed fields considering slice
      let processedData = dataToProcess;
      if (Object.keys(computedFields).length > 0) {
        processedData = dataToProcess.map((item, sliceIndex) => {
          const originalIndex = actualStartIndex + sliceIndex;
          const computedProps: Record<string, any> = {};
          
          // Calculate all computed fields for this item with original index and original array
          Object.entries(computedFields).forEach(([key, computeFn]) => {
            computedProps[key] = computeFn(item, originalIndex, originalArray);
          });

          // Combine computed and original fields
          if (computedFieldsFirst) {
            return { ...computedProps, ...item };
          } else {
            return { ...item, ...computedProps };
          }
        });
      }

      let result = '';
      
      processedData.forEach((item, sliceIndex) => {
        const originalIndex = actualStartIndex + sliceIndex;
        const itemNumber = originalIndex + indexOffset;
        
        // Determine entry title based on configuration
        let entryTitle = entryTitleDefault;
        if (entryTitleKey && typeof item === 'object' && item !== null) {
          const titleValue = item[entryTitleKey];
          if (titleValue) {
            entryTitle = `"${titleValue}"`;
          }
        }
        
        switch (format) {
          case 'sections':
            if (entryTitleAsPrefix && entryTitleKey) {
              result += `${itemPrefix} ${itemNumber + 1} - ${entryTitle} ${itemSuffix}\n`;
            } else {
              result += `${itemPrefix} ${itemNumber + 1} ${itemSuffix}\n`;
            }
            result += formatObject(item);
            break;
            
          case 'numbered':
            result += `[${itemNumber + 1}] ${entryTitle}\n`;
            result += formatObject(item, '  - ');
            break;
            
          case 'table':
            result += `| ENTRY ${itemNumber + 1} - ${entryTitle} |\n`;
            result += formatObject(item);
            break;
            
          case 'separator':
            result += `${separator} ENTRY ${itemNumber + 1} - ${entryTitle} ${separator}\n`;
            result += formatObject(item);
            break;
        }
        
        if (sliceIndex < processedData.length - 1) {
          result += '\n';
        }
      });
      
      return result;
    } else {
      // Format single object - computed fields only if explicitly desired
      if (Object.keys(computedFields).length > 0) {
        const computedProps: Record<string, any> = {};
        Object.entries(computedFields).forEach(([key, computeFn]) => {
          computedProps[key] = computeFn(data, 0, [data]);
        });
        
        if (computedFieldsFirst) {
          data = { ...computedProps, ...data };
        } else {
          data = { ...data, ...computedProps };
        }
      }
      
      return formatObject(data);
    }
  }

  /**
   * Converts a JSON object to sections format with markdown headers
   */
  static toSections(data: any, options: any = {}): string {
    return this.flatten(data, { format: 'sections', ...options });
  }

  /**
   * Converts a JSON object to numbered list format
   */
  static toNumberedList(data: any, options: any = {}): string {
    return this.flatten(data, { format: 'numbered', ...options });
  }

  /**
   * Converts a JSON object to table-like format
   */
  static toTable(data: any, options: any = {}): string {
    return this.flatten(data, { format: 'table', ...options });
  }

  /**
   * Converts a JSON object to separator format
   */
  static toSeparated(data: any, options: any = {}): string {
    return this.flatten(data, { format: 'separator', ...options });
  }

  /**
   * Convenience method for commonly used computed fields
   */
  static withCommonComputedFields(
    data: any,
    options: any,
    includeIndex: boolean = true,
    includePosition: boolean = true,
    indexOffset: number = 0
  ): string {
    const computedFields: ComputedFieldOptions = {};

    if (includeIndex) {
      computedFields['Index'] = (item, index) => index + indexOffset;
    }

    if (includePosition) {
      computedFields['Position'] = (item, index, allItems) => 
        `${index + indexOffset + 1} of ${allItems.length}`;
    }

    return this.flatten(data, {
      ...options,
      computedFields,
      indexOffset
    });
  }

  /**
   * Convenience method for array slicing
   */
  static sliceArray(
    data: any,
    start?: number,
    end?: number,
    options: any = {}
  ): string {
    return this.flatten(data, {
      ...options,
      arraySliceStart: start,
      arraySliceEnd: end
    });
  }
}

/**
 * FormatConfigurator - Enables creating custom formatting configurations
 */
export class FormatConfigurator {
  private formatOptions: any;

  constructor(baseOptions: any = {}) {
    this.formatOptions = {
      format: 'sections',
      itemPrefix: '###',
      itemSuffix: '###',
      indentLevel: 2,
      includeArrayIndices: true,
      separator: '===',
      keyValueSeparator: ': ',
      ignoreEmptyValues: true,
      ignoredKeys: [],
      customFormatters: {},
      entryTitleKey: undefined,
      entryTitleAsPrefix: false,
      entryTitleDefault: 'ENTRY',
      computedFields: {},
      computedFieldsFirst: true,
      indexOffset: 0,
      arraySliceStart: undefined,
      arraySliceEnd: undefined,
      ...baseOptions
    };
  }

  // Fluent API methods for configuration
  withFormat(format: 'sections' | 'numbered' | 'table' | 'separator') {
    this.formatOptions.format = format;
    return this;
  }

  withItemPrefix(prefix: string) {
    this.formatOptions.itemPrefix = prefix;
    return this;
  }

  withItemSuffix(suffix: string) {
    this.formatOptions.itemSuffix = suffix;
    return this;
  }

  withIndentLevel(level: number) {
    this.formatOptions.indentLevel = level;
    return this;
  }

  withSeparator(separator: string) {
    this.formatOptions.separator = separator;
    return this;
  }

  withKeyValueSeparator(separator: string) {
    this.formatOptions.keyValueSeparator = separator;
    return this;
  }

  ignoreEmptyValues(ignore: boolean) {
    this.formatOptions.ignoreEmptyValues = ignore;
    return this;
  }

  ignoreKeys(...keys: string[]) {
    this.formatOptions.ignoredKeys = [...this.formatOptions.ignoredKeys, ...keys];
    return this;
  }

  withCustomFormatter(key: string, formatter: (value: any) => string) {
    this.formatOptions.customFormatters[key] = formatter;
    return this;
  }

  // Methods for entry title configuration
  withEntryTitleKey(key: string) {
    this.formatOptions.entryTitleKey = key;
    return this;
  }

  withEntryTitleAsPrefix(asPrefix: boolean = true) {
    this.formatOptions.entryTitleAsPrefix = asPrefix;
    return this;
  }

  withEntryTitleDefault(defaultTitle: string) {
    this.formatOptions.entryTitleDefault = defaultTitle;
    return this;
  }

  // Methods for computed fields
  withComputedField(key: string, computeFn: (item: any, index: number, allItems: any[]) => any) {
    this.formatOptions.computedFields[key] = computeFn;
    return this;
  }

  withIndexField(key: string = 'No', offset: number = 1) {
    this.formatOptions.computedFields[key] = (item: any, index: number) => index + offset;
    return this;
  }

  withPositionField(key: string = 'Position', offset: number = 1) {
    this.formatOptions.computedFields[key] = (item: any, index: number, allItems: any[]) => 
      `${index + offset} of ${allItems.length}`;
    return this;
  }

  computedFieldsFirst(first: boolean = true) {
    this.formatOptions.computedFieldsFirst = first;
    return this;
  }

  // Index offset method
  withIndexOffset(offset: number) {
    this.formatOptions.indexOffset = offset;
    return this;
  }

  // Array slice methods
  withArraySlice(start?: number, end?: number) {
    this.formatOptions.arraySliceStart = start;
    this.formatOptions.arraySliceEnd = end;
    return this;
  }

  withArraySliceStart(start: number) {
    this.formatOptions.arraySliceStart = start;
    return this;
  }

  withArraySliceEnd(end: number) {
    this.formatOptions.arraySliceEnd = end;
    return this;
  }

  // Final method that returns the configured format
  build() {
    return this.formatOptions;
  }

  // Direct formatting with current settings
  format(data: any) {
    return FlatFormatter.flatten(data, this.formatOptions);
  }
}