### How to generate new metrics
-------------------------------

There are several requirements for generating the metrics used by KaTeX.

- You need to have an installation of TeX which supports kpathsea. You can check
  this by running `tex --version`, and seeing if it has a line that looks like
  > kpathsea version 6.2.0

- You need the JSON module for perl. You can install this either from CPAN or with
  your package manager.

- You need the python fontforge module. This is probably either installed with
  fontforge or can be installed from your package manager.

Once you have these things, run

    make metrics

which should generate new metrics and place them into `fontMetrics.js`. You're
done!

### OSX Notes

brew is probably the easiest way to install these dependencies.

Install cpamn because it makes installing perl modules easy: 

    brew install cpanm

Install the JSON perl module:
    
    cpanm JSON

Set your PERL5

    export PERL5LIB=~/perl5/lib/perl5

Install fontforge:

    brew install fontforge
    
You may have to change the shebang in extract_ttfs.py to:

    #!/usr/local/Cellar/python/2.7.9/bin/python
