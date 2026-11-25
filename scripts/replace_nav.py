with open('products.html', 'r', encoding='utf-8') as f:
    text = f.read()

start_marker = '  <!-- Full-Screen Navigation Menu -->'
end_marker = '  </header>'

start_pos = text.find(start_marker)
end_pos = text.find(end_marker) + len(end_marker)

replacement = """  <!-- Header Sticky Navigation Bar -->
  <header class="nav" id="nav">
    <a class="brand" href="index.html#home" aria-label="TranzLife Biosciences home">
      <span class="logo-em" aria-hidden="true"></span>
      <span class="logo-word" aria-hidden="true"></span>
    </a>
    <nav class="nav-pills" aria-label="Main">
      <a href="index.html#home">Home</a>
      <a href="products.html" class="on">Products</a>
      <a href="index.html#benefits">Benefits</a>
      <a href="index.html#process">Process</a>
      <a href="index.html#science">Science</a>
    </nav>
    <div class="nav-act">
      <button class="bag" id="bagBtn" aria-label="Open bag">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M5 8h14l-1.2 12H6.2z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
        <em id="bagCount">0</em>
      </button>
      <a class="pill" href="#lineup"><i aria-hidden="true">↓</i><b>View all</b></a>
    </div>
  </header>"""

new_text = text[:start_pos] + replacement + text[end_pos:]
with open('products.html', 'w', encoding='utf-8') as f:
    f.write(new_text)
print("Successfully replaced navbar in products.html!")
