import { AutoRestExtension } from '@azure-tools/autorest-extension-base';
import { Helper } from './helper';
import { Modifier } from './plugins/modifier/modifier';
import { CommonNamer } from './plugins/namer';
import { processRequest as flattenSetter } from './plugins/flattenSetter/flattenSetter';
import { processRequest as splitOperation } from './plugins/splitOperation';
import { processRequest as preNamer } from './plugins/prenamer';
import { CliConst } from './schema';
import { processRequest as polyAsResourceModifier } from './plugins/polyAsResourceModifier';
import { processRequest as polyAsParamModifier } from './plugins/polyAsParamModifier';
import { processRequest as complexMarker } from './plugins/complexMarker';
import { processRequest as visibilityCleaner } from './plugins/visibilityCleaner';
import { processRequest as flattenModifier } from './plugins/flattenModifier';
import { processRequest as modelerPostProcessor } from './plugins/modelerPostProcessor';

const extension = new AutoRestExtension();

extension.Add("clicommon", async host => {
    const session = await Helper.init(host);

    Helper.dumper.dumpCodeModel("modifier-pre");
    
    const arr = await session.getValue(CliConst.CLI_DIRECTIVE_KEY, null);
    const modifier = await new Modifier(session).init(arr);
    let result = modifier.process();

    Helper.dumper.dumpCodeModel("modifier-post");

    const namer = await new CommonNamer(session).init();
    result = namer.process();

    Helper.dumper.dumpCodeModel("namer-post");

    // add test scenario from common settings
    const cliCommonSettings = await host.GetValue("cli");
    if (cliCommonSettings) {
        result["test-scenario"] = cliCommonSettings['test-scenario'] || cliCommonSettings['test-setup'];
    }

    Helper.outputToModelerfour();
    await Helper.dumper.persistAsync();
});

extension.Add("cli-flatten-setter", flattenSetter);
extension.Add("cli-prenamer", preNamer);
extension.Add("cli-split-operation", splitOperation);
extension.Add("cli-modeler-post-processor", modelerPostProcessor);
extension.Add("cli-poly-as-resource-modifier", polyAsResourceModifier);
extension.Add("cli-flatten-modifier", flattenModifier);
extension.Add("cli-poly-as-param-modifier", polyAsParamModifier);
extension.Add("cli-complex-marker", complexMarker);
extension.Add("cli-visibility-cleaner", visibilityCleaner);
extension.Run();