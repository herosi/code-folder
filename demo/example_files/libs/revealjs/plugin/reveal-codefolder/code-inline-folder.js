// Inline folding plugin configuration
window.CODE_INLINE_FOLDER_CONFIG = window.CODE_INLINE_FOLDER_CONFIG || {
  defaultMarker: "...",
  
  style: {
    markerColor: "black",
    markerOpacity: 0.7,
    markerCursor: "pointer",
    markerHoverOpacity: 1.0,
    markerFontStyle: 'bold',
    markerFontSize: '0.5em',
    markerBackgroundColor: '#c0c0c0',
    markerBorder: '0.1px solid black',
    markerBorderRadius: '3px',
    markerPaddingBottom: '2px',
    markerPaddingLeft: '2px',
    markerPaddingRight: '2px',
    markerMarginLeft: '5px',
    markerMarginRight: '5px'
   }
};

const CODE_INLINE_FOLDER_CONFIG = window.CODE_INLINE_FOLDER_CONFIG;

// Initialize the configuration
function initCodeInlineFolding() {
  if (window.Reveal) {
    if (Reveal.isReady()) {
      setTimeout(() => applyCodeInlineFolding(), 150);
    } else {
      Reveal.on('ready', function() {
        setTimeout(() => applyCodeInlineFolding(), 150);
      });
    }
  } else {
    setTimeout(() => applyCodeInlineFolding(), 150);
  }
}

// Apply inline folding
function applyCodeInlineFolding() {
  // console.log('applyCodeInlineFolding called');
  const marker = CODE_INLINE_FOLDER_CONFIG.defaultMarker || "...";
  
  let foundBlocks = 0;
  
  document.querySelectorAll('pre code').forEach(function(code) {
    if (code.hasAttribute('data-inline-folded')) return;
    
    const pre = code.parentElement;
    const sourceCodeDiv = pre.parentElement;
    
    let foldRangesAttr = null;
    if (sourceCodeDiv && sourceCodeDiv.classList.contains('sourceCode')) {
      foldRangesAttr = sourceCodeDiv.getAttribute('data-fold-line-ranges');
      // console.log('Checking sourceCodeDiv:', sourceCodeDiv, 'attr:', foldRangesAttr);
    }
    
    if (!foldRangesAttr) {
      foldRangesAttr = pre.getAttribute('data-fold-line-ranges') || code.getAttribute('data-fold-line-ranges');
      // console.log('Checking pre/code:', foldRangesAttr);
    }
    
    if (!foldRangesAttr) return;
    
    // console.log('Found fold-line-ranges:', foldRangesAttr);
    foundBlocks++;
    
    code.setAttribute('data-inline-folded', 'true');
    
    // Parse fold configuration (e.g., "1:5-10, 1:17-20, 3:7-")
    const foldConfigs = parseFoldRanges(foldRangesAttr);
    // console.log('Parsed fold configs:', foldConfigs);
    
    // Group ranges by line
    const foldsByLine = {};
    foldConfigs.forEach(function(config) {
      if (!foldsByLine[config.lineNum]) {
        foldsByLine[config.lineNum] = [];
      }
      foldsByLine[config.lineNum].push(config);
    });
    
    // console.log('Folds by line:', foldsByLine);
    
    // Process each line
    Object.keys(foldsByLine).forEach(function(lineNum) {
      const lineSpan = code.querySelector(`span[id$="-${lineNum}"]`);
      // console.log(`Looking for line ${lineNum}:`, lineSpan);
      
      if (!lineSpan) return;
      
      const folds = foldsByLine[lineNum].sort((a, b) => b.startChar - a.startChar);
      
      folds.forEach(function(fold) {
        console.log(`Applying fold to line ${lineNum}:`, fold);
        applyInlineFold(lineSpan, fold.startChar, fold.endChar, marker);
      });
    });
  });
  
  console.log('Total blocks with fold-line-ranges:', foundBlocks);
}

// Parse folding configuration
function parseFoldRanges(rangesStr) {
  const ranges = rangesStr.split(',').map(s => s.trim());
  const configs = [];
  
  ranges.forEach(function(range) {
    // Expected format: "1:5-10" or "3:7-"
    const match = range.match(/(\d+):(\d+)-(\d*)$/);
    if (!match) return;
    
    const lineNum = parseInt(match[1]);
    const startChar = parseInt(match[2]);
    const endChar = match[3] ? parseInt(match[3]) : null; // null = to the end of the line
    
    configs.push({
      lineNum: lineNum,
      startChar: startChar,
      endChar: endChar
    });
  });
  
  return configs;
}

// Fold a specified range within a line
function applyInlineFold(lineSpan, startChar, endChar, marker) {
  // Calculate text node positions (excluding HTML tags)
  const textPosition = getTextPositions(lineSpan);
  
  if (textPosition.length === 0) return;
  
  // Last character position
  const lastPos = textPosition[textPosition.length - 1].textIndex + 1;
  
  // If endChar is null (to the end of the line) or out of range, use the last position
  const actualEndChar = (endChar === null || endChar > lastPos) ? lastPos : endChar;
  
  if (startChar >= actualEndChar) return;
  
  // Determine the folding range
  const startInfo = findCharPosition(textPosition, startChar);
  const endInfo = findCharPosition(textPosition, actualEndChar + 1);
  
  if (!startInfo || !endInfo) return;
  
  // Extract the range using `Range`
  const range = document.createRange();
  range.setStart(startInfo.node, startInfo.offset);
  range.setEnd(endInfo.node, endInfo.offset);
  
  // Extract the range and wrap it in a new `span`
  const extractedContent = range.extractContents();
  
  // Span that holds the folded content
  const foldedSpan = document.createElement('span');
  foldedSpan.className = 'code-inline-folded';
  foldedSpan.style.display = 'none';
  foldedSpan.appendChild(extractedContent);
  
  // Create a marker
  const markerSpan = document.createElement('span');
  markerSpan.className = 'code-inline-marker';
  markerSpan.textContent = marker;
  markerSpan.style.display = 'inline-block';
  markerSpan.style.verticalAlign = 'middle';
  markerSpan.style.color = CODE_INLINE_FOLDER_CONFIG.style?.markerColor || 'black';
  markerSpan.style.opacity = CODE_INLINE_FOLDER_CONFIG.style?.markerOpacity || 0.7;
  markerSpan.style.cursor = CODE_INLINE_FOLDER_CONFIG.style?.markerCursor || 'pointer';
  markerSpan.style.fontStyle = CODE_INLINE_FOLDER_CONFIG.style?.markerFontStyle || 'bold';
  markerSpan.style.fontSize = CODE_INLINE_FOLDER_CONFIG.style?.markerFontSize || '0.5em';
  markerSpan.style.backgroundColor = CODE_INLINE_FOLDER_CONFIG.style?.markerBackgroundColor || '#c0c0c0';
  markerSpan.style.border = CODE_INLINE_FOLDER_CONFIG.style?.markerBorder || 'none';
  markerSpan.style.borderRadius = CODE_INLINE_FOLDER_CONFIG.style?.markerBorderRadius || '3px';
  markerSpan.style.paddingBottom = CODE_INLINE_FOLDER_CONFIG.style?.markerPaddingBottom || '2px';
  markerSpan.style.paddingLeft = CODE_INLINE_FOLDER_CONFIG.style?.markerPaddingLeft || '2px';
  markerSpan.style.paddingRight = CODE_INLINE_FOLDER_CONFIG.style?.markerPaddingRight || '2px';
  markerSpan.style.marginLeft = CODE_INLINE_FOLDER_CONFIG.style?.markerMarginLeft || '5px';
  markerSpan.style.marginRight = CODE_INLINE_FOLDER_CONFIG.style?.markerMarginRight || '5px';

  // Hover effect
  const hoverOpacity = CODE_INLINE_FOLDER_CONFIG.style?.markerHoverOpacity || 1.0;
  markerSpan.addEventListener('mouseenter', function() {
    markerSpan.style.opacity = hoverOpacity;
  });
  markerSpan.addEventListener('mouseleave', function() {
    markerSpan.style.opacity = CODE_INLINE_FOLDER_CONFIG.style?.markerOpacity || 0.7;
  });
  
  // Expand on click
  markerSpan.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    markerSpan.style.display = 'none';
    foldedSpan.style.display = 'inline';
    foldedSpan.style.cursor = 'pointer';
  });
  
  // Collapse the folded content on click
  foldedSpan.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    foldedSpan.style.display = 'none';
    foldedSpan.style.cursor = '';
    markerSpan.style.display = 'inline';
  });
  
  // Insert at the original position
  range.insertNode(foldedSpan);
  range.insertNode(markerSpan);
}

// Get text positions excluding HTML tags
function getTextPositions(element) {
  const positions = [];
  let textIndex = 0;
  
  function traverse(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      for (let i = 0; i < text.length; i++) {
        positions.push({
          node: node,
          offset: i,
          textIndex: textIndex,
          char: text[i]
        });
        textIndex++;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Skip `<a>` tags used for line numbers
      if (node.tagName.toLowerCase() === 'a' && node.getAttribute('href') === '') {
        return;
      }
      
      // Process child nodes
      Array.from(node.childNodes).forEach(traverse);
    }
  }
  
  traverse(element);
  return positions;
}

// Find the node and offset for the specified character position
function findCharPosition(positions, charIndex) {
  // Convert charIndex from 1-based to 0-based
  const index = charIndex - 1;
  
  if (index < 0 || index >= positions.length) {
    // Return the last position if out of range
    const last = positions[positions.length - 1];
    return {
      node: last.node,
      offset: last.offset + 1
    };
  }
  
  const pos = positions[index];
  return {
    node: pos.node,
    offset: pos.offset
  };
}

// Initialize
/*
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCodeInlineFolding);
} else {
  initCodeInlineFolding();
}
*/