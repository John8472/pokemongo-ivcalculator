# coding=utf8

import sys

# Load data from https://bulbapedia.bulbagarden.net/w/index.php?title=List_of_Pok%C3%A9mon_by_evolution_family&action=edit
# Store in evolution_mapping.txt
# Filter out only the {{lop/ calls

class TemplateCall(object):
    def __init__(self, name):
        self.name = name
        self.args = []

    def __repr__(self):
        res = '{{' + self.name
        if not self.args:
            return res + '}}'

        for arg in self.args:
            res += '|' + repr(arg)

        return res + '}}'


class Parser(object):
    def __init__(self, line):
        self.idx = 0
        self.line = line

    def parse(self, stop_on_pipe=False):
        parts = []

        start = self.idx

        while True:
            if 'EOF' == self.peek_char_():
                break

            if stop_on_pipe and (('|' == self.peek_char_()) or ('}' == self.peek_char_())):
                break

            if '{' == self.peek_char_():
                parts.append(self.line[start:self.idx])
                parts.append(self.parse_template_call())
                start = self.idx
                continue

            self.skip_char_()

        parts.append(self.line[start:self.idx])

        return parts

    def parse_template_call(self):
        self.assert_char_('{')
        self.assert_char_('{')

        start = self.idx
        while True:
            if '}' == self.peek_char_():
                self.assert_char_('}')
                self.assert_char_('}')
                return TemplateCall(self.line[start:self.idx - 2])

            char = self.skip_char_()
            if '|' == char:
                break

        res = TemplateCall(self.line[start:self.idx - 1])

        while True:
            if '}' == self.peek_char_():
                break

            res.args.append(self.parse(stop_on_pipe=True))

            if '}' == self.peek_char_():
                break

            self.assert_char_('|')

        self.assert_char_('}')
        self.assert_char_('}')

        return res

    def assert_char_(self, char):
        if char != self.line[self.idx]:
            raise AssertionError('Expected \'' + char + '\', got "' + self.line[self.idx:self.idx + 100] + '"')

        self.idx += 1

    def peek_char_(self):
        if len(self.line) <= self.idx:
            return 'EOF'

        return self.line[self.idx]

    def skip_char_(self):
        char = self.line[self.idx]
        self.idx += 1
        return char


def render(x):
    return ''.join(x)

def print_line(a, b):
    a = [render(x) for x in a]
    b = [render(x) for x in b]

    if a[0].endswith('A') or b[0].endswith('A'):
        return

    sys.stdout.write('[' + str(int(a[0])) + ',' + str(int(b[0])) + '],')
#    sys.stdout.write(' // ' + a[1] + ' => ' + b[1] + '\n')

def compile_lop_evo_call(call):
    if 'lop/evo-Nidoran' == call.name:
        print_line(['029', 'Nidoran♀'], ['030', 'Nidorina'])
        print_line(['030', 'Nidorina'], ['031', 'Nidoqueen'])

        print_line(['032', 'Nidoran♂'], ['033', 'Nidorino'])
        print_line(['033', 'Nidorino'], ['034', 'Nidoking'])

        return

    if 'lop/evo' == call.name:
        idx = 2
        while idx + 3 < len(call.args):
            print_line(call.args[idx:idx+2], call.args[idx+3:idx+5])
            idx += 3
        return

    if 'lop/evo-branch-1' == call.name:
        print_line(call.args[2:4], call.args[5:7])
        print_line(call.args[2:4], call.args[8:10])

        return

    if 'lop/evo-branch-2' == call.name:
        print_line(call.args[2:4], call.args[5:7])
        print_line(call.args[5:7], call.args[8:10])
        print_line(call.args[5:7], call.args[11:13])

        return

    if 'lop/evo-branch-multi' == call.name:
        idx = 5
        while idx < len(call.args):
            print_line(call.args[2:4], call.args[idx:idx + 2])

            idx += 3
        return


    if 'lop/evo-Unown' == call.name:
        return

    if 'lop/evo-group' == call.name:
        return

    sys.stderr.write('UNRECOGNIZED TEMPLATE CALL: ' + repr(call) + '\n')

if '__main__' == __name__:
    with open('evolution_mapping.txt', 'r') as tf:
        data = tf.read()

    x = Parser(data)
    for part in x.parse():
        if isinstance(part, TemplateCall):
            compile_lop_evo_call(part)

