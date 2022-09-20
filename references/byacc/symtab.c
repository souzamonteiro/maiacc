#include <stdlib.h>
#include <string.h>
#include "defs.h"


/* TABLE_SIZE is the number of entries in the symbol table. */
/* TABLE_SIZE must be a power of two.			    */

#define	TABLE_SIZE 1024

static bucket **symbol_table;
bucket *first_symbol;
bucket *last_symbol;


static int
hash(char *name)
{
    char *s;
    int c, k;

    assert(name && *name);
    s = name;
    k = *s;
    while (c = *++s)
	k = (31 * k + c) & (TABLE_SIZE - 1);

    return (k);
}


bucket *
make_bucket(char *name)
{
    bucket *bp;

    assert(name);
    bp = (bucket *) emalloc(sizeof(bucket));
    bp->link = 0;
    bp->next = 0;
    bp->name = emalloc(strlen(name) + 1);
    bp->tag = 0;
    bp->value = UNDEFINED;
    bp->index = 0;
    bp->prec = 0;
    bp->class = UNKNOWN;
    bp->assoc = TOKEN;

    strcpy(bp->name, name);

    return (bp);
}


bucket *
lookup(char *name)
{
    bucket *bp, **bpp;

    bpp = symbol_table + hash(name);
    bp = *bpp;

    while (bp) {
	if (strcmp(name, bp->name) == 0)
	    return (bp);
	bpp = &bp->link;
	bp = *bpp;
    }

    *bpp = bp = make_bucket(name);
    last_symbol->next = bp;
    last_symbol = bp;

    return (bp);
}


void
create_symbol_table(void)
{
    int i;
    bucket *bp;

    symbol_table = (bucket **) emalloc(TABLE_SIZE * sizeof(bucket *));

    for (i = 0; i < TABLE_SIZE; i++)
	symbol_table[i] = 0;

    bp = make_bucket("error");
    bp->index = 1;
    bp->class = TERM;

    first_symbol = bp;
    last_symbol = bp;
    symbol_table[hash("error")] = bp;
}


void
free_symbol_table(void)
{
    free(symbol_table);
    symbol_table = 0;
}


void
free_symbols(void)
{
    bucket *p, *q;

    for (p = first_symbol; p; p = q) {
	q = p->next;
	free(p);
    }
}
