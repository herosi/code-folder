// Code block folding plugin configuration
// Function to merge multiple configurations
function mergeConfigs(...configs) {
  const result = {
    defaultSummary: "<snip>",
    style: {},
    blocks: {}
  };
  
  configs.forEach(config => {
    if (!config) return;
    
    if (config.defaultSummary) {
      result.defaultSummary = config.defaultSummary;
    }
    
    if (config.style) {
      Object.assign(result.style, config.style);
    }
    
    if (config.blocks) {
      Object.keys(config.blocks).forEach(blockId => {
        if (!result.blocks[blockId]) {
          result.blocks[blockId] = [];
        }
        result.blocks[blockId].push(...config.blocks[blockId]);
      });
    }
  });
  
  return result;
}

// Load configuration from code block attributes
function loadConfigFromAttributes(pre) {
  const code = pre.querySelector('code');
  if (!code) return null;
  
  // Look for attributes on `div.sourceCode` (Quarto structure)
  const sourceCodeDiv = pre.parentElement;
  let foldLinesAttr = null;
  let summaryAttr = null;
  
  if (sourceCodeDiv && sourceCodeDiv.classList.contains('sourceCode')) {
    foldLinesAttr = sourceCodeDiv.getAttribute('data-fold-lines');
    summaryAttr = sourceCodeDiv.getAttribute('data-fold-summary');
  }
  
  // Fallback: also check `pre` and `code` elements
  if (!foldLinesAttr) {
    foldLinesAttr = pre.getAttribute('data-fold-lines') || code.getAttribute('data-fold-lines');
    summaryAttr = pre.getAttribute('data-fold-summary') || code.getAttribute('data-fold-summary');
  }
  
  if (!foldLinesAttr) return null;
  
  // Parse line ranges: (e.g., "4-7,9-11")
  const ranges = foldLinesAttr.split(',').map(s => s.trim());
  const summaries = summaryAttr ? summaryAttr.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')) : [];
  
  const folds = ranges.map((range, index) => {
    const [start, end] = range.split('-').map(n => parseInt(n.trim()));
    return {
      startLine: start,
      endLine: end,
      summary: summaries[index] || CODE_FOLDER_CONFIG?.defaultSummary || `<snip>`
    };
  });
  
  return folds;
}

// Load configuration
function initCodeFolding() {
  // Default configuration
  const defaultConfig = {
    defaultSummary: "<snip>",
    style: {
      headerFontSize: '0.85em',
      headerOpacity: 0.6,
      headerPadding: '0.2em 0.6em 0.2em 4.5em',
      headerBackgroundColor: 'rgba(100, 100, 100, 0.1)',
      headerBorderColor: '#999',
      headerHoverBackgroundColor: 'rgba(100, 100, 100, 0.2)',
      headerHoverOpacity: 0.8,
      collapsedIcon: '>',
      expandedIcon: 'V'
    },
    blocks: {}
  };
  
  // Merge with window.CODE_FOLDER_CONFIG
  const finalConfig = mergeConfigs(defaultConfig, window.CODE_FOLDER_CONFIG);
  window.CODE_FOLDER_CONFIG = finalConfig;
  
  console.log('Final config:', finalConfig);
  
  if (window.Reveal) {
    if (Reveal.isReady()) {
        setTimeout(() => applyCodeFolding(), 100);
    } else {
      Reveal.on('ready', function() {
        setTimeout(() => applyCodeFolding(), 100);
      });
    }
  } else {
    setTimeout(() => applyCodeFolding(), 100);
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCodeFolding);
} else {
  initCodeFolding();
}

if (window.Reveal) {
  Reveal.on('ready', function() {
    setTimeout(applyCodeFolding, 100);
  });
} else {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(applyCodeFolding, 100);
  });
}

function applyCodeFolding() {
  const CODE_FOLDER_CONFIG = window.CODE_FOLDER_CONFIG;
  if (!CODE_FOLDER_CONFIG) {
    console.error('CODE_FOLDER_CONFIG not loaded');
    return;
  }
  
  const collapsedIcon = CODE_FOLDER_CONFIG.style?.collapsedIcon !== undefined ? CODE_FOLDER_CONFIG.style.collapsedIcon : '>';
  const expandedIcon = CODE_FOLDER_CONFIG.style?.expandedIcon !== undefined ? CODE_FOLDER_CONFIG.style.expandedIcon : 'V';
  
  // Add a space if the icon is not an empty string
  const collapsedPrefix = collapsedIcon ? collapsedIcon + ' ' : '';
  const expandedPrefix = expandedIcon ? expandedIcon + ' ' : '';
  
  // Process all code blocks
  document.querySelectorAll('pre code').forEach(function(code) {
    const pre = code.parentElement;
    
    // Skip if already processed
    if (code.hasAttribute('data-code-folded')) return;
    
    // Get the block ID from the class name (e.g., .fold-example1)
    let blockId = null;
    let foldConfigs = null;
    
    pre.classList.forEach(function(className) {
      if (className.startsWith('fold-')) {
        blockId = className.substring(5);
        foldConfigs = CODE_FOLDER_CONFIG.blocks[blockId];
      }
    });
    
    // Load configuration from attributes (this takes precedence)
    const attrConfigs = loadConfigFromAttributes(pre);
    if (attrConfigs) {
      foldConfigs = attrConfigs;
      blockId = blockId || 'attr-' + Math.random().toString(36).substr(2, 9);
    }
    
    if (!foldConfigs || foldConfigs.length === 0) return;
    
    code.setAttribute('data-code-folded', 'true');
    
    const lineSpans = Array.from(code.children).filter(function(child) {
      return child.tagName === 'SPAN' && child.id && child.id.match(/^cb\d+-\d+$/);
    });
    
    if (lineSpans.length === 0) return;
    
    const sortedConfigs = [...foldConfigs].sort((a, b) => b.startLine - a.startLine);
    
    sortedConfigs.forEach(function(foldConfig) {
      const startLine = foldConfig.startLine;
      const endLine = foldConfig.endLine;
      const foldId = 'fold-' + blockId + '-' + startLine + '-' + endLine;
      
      const targetSpans = lineSpans.filter(function(span) {
        const lineNum = parseInt(span.id.split('-')[1]);
        return lineNum >= startLine && lineNum <= endLine;
      });
      
      if (targetSpans.length === 0) return;
      
      // Array to preserve line breaks
      const savedNewlines = [];
      
      // Create the header
      const header = document.createElement('span');
      header.className = 'code-fold-header';
      header.setAttribute('data-fold-id', foldId);
      header.textContent = collapsedPrefix + (foldConfig.summary || CODE_FOLDER_CONFIG.defaultSummary) + ' (L' + startLine + '-' + endLine + ')';
      
      // Apply styles (also apply styles from the config file for attribute-based settings)
      if (CODE_FOLDER_CONFIG.style) {
        const style = CODE_FOLDER_CONFIG.style;
        if (style.headerFontSize) header.style.fontSize = style.headerFontSize;
        if (style.headerOpacity !== undefined) header.style.opacity = style.headerOpacity;
        if (style.headerPadding) header.style.padding = style.headerPadding;
        if (style.headerBackgroundColor) header.style.backgroundColor = style.headerBackgroundColor;
        if (style.headerBorderColor) header.style.borderLeftColor = style.headerBorderColor;
        
        // Hover event
        if (style.headerHoverOpacity !== undefined || style.headerHoverBackgroundColor) {
          const originalOpacity = header.style.opacity;
          const originalBgColor = header.style.backgroundColor;
          
          header.addEventListener('mouseenter', function() {
            if (style.headerHoverOpacity !== undefined) header.style.opacity = style.headerHoverOpacity;
            if (style.headerHoverBackgroundColor) header.style.backgroundColor = style.headerHoverBackgroundColor;
          });
          
          header.addEventListener('mouseleave', function() {
            header.style.opacity = originalOpacity;
            header.style.backgroundColor = originalBgColor;
          });
        }
      }
      
      const firstSpan = targetSpans[0];
      
      // Insert the header
      firstSpan.parentNode.insertBefore(header, firstSpan);
      
      // Hide the target span element and remove the following line break
      targetSpans.forEach(function(span, index) {
        span.classList.add('code-fold-hidden');
        span.setAttribute('data-fold-id', foldId);
        
        // Store and remove the trailing newline text node
        const nextSibling = span.nextSibling;
        if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE && nextSibling.textContent === '\n') {
          savedNewlines.push({
            span: span,
            newline: nextSibling
          });
          nextSibling.remove();
        }
      });
      
      // Store data in the header
      header.setAttribute('data-saved-newlines', JSON.stringify(savedNewlines.length));
      
      // Click event
      header.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isOpen = header.classList.contains('open');
        
        if (isOpen) {
          // Close: hide the content and remove the line break
          header.classList.remove('open');
          header.textContent = collapsedPrefix + (foldConfig.summary || CODE_FOLDER_CONFIG.defaultSummary) + ' (L' + startLine + '-' + endLine + ')';
          header.style.display = 'block';
          
          targetSpans.forEach(function(span) {
            span.classList.add('code-fold-hidden');
            span.style.cursor = '';
            
            // Remove the line break
            const nextSibling = span.nextSibling;
            if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE && nextSibling.textContent === '\n') {
              nextSibling.remove();
            }
          });
        } else {
          // Open: show the content, restore the line break, and hide the header
          header.classList.add('open');
          header.style.display = 'none';
          
          targetSpans.forEach(function(span) {
            span.classList.remove('code-fold-hidden');
            span.style.cursor = 'pointer';
            
            // Restore the line break
            const nextSpan = span.nextSibling;
            if (!nextSpan || nextSpan.nodeType !== Node.TEXT_NODE) {
              span.parentNode.insertBefore(document.createTextNode('\n'), nextSpan);
            }
          });
        }
      });
      
      // Add a click event to the target span element (collapse when open)
      targetSpans.forEach(function(span) {
        span.addEventListener('click', function(e) {
          if (header.classList.contains('open')) {
            e.preventDefault();
            e.stopPropagation();
            
            // Trigger the header click event
            header.click();
          }
        });
      });
    });
  });
}

// Initialize
/*
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCodeFolding);
} else {
  initCodeFolding();
}
*/