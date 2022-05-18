import findImports from 'find-imports';

const files = 'src/*';

const imp = findImports(files, {
    absoluteImports: true,
    relativeImports: true
});

console.log("here:", imp);
