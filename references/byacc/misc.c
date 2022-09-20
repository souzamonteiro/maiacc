#include <stdio.h>
#include <malloc.h>
#include "defs.h"

void *
emalloc(size_t n)
{
    void *p = malloc(n);
    if (p == NULL)
    	no_space();
    return p;
}

void *
erealloc(void *ptr, size_t size)
{
    void *p = realloc(ptr, size);
    if (p == NULL)
    	no_space();
    return p;
}

void *
allocate(size_t n)
{
    char *p = NULL;

    if (n) {
	p = calloc(1, n);
	if (p == NULL)
	    no_space();
    }
    return (p);
}

