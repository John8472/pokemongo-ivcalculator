
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
